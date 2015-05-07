#!/usr/bin/env python

import os, sys, inspect

# importing from the websocket directory
cmd_subfolder = os.path.realpath(os.path.abspath(os.path.join(os.path.split(inspect.getfile( inspect.currentframe() ))[0],"SimpleWebSocketServer")))
if cmd_subfolder not in sys.path:
	sys.path.insert(0, cmd_subfolder)

import signal, ssl, logging
from SimpleWebSocketServer import WebSocket, SimpleWebSocketServer, SimpleSSLWebSocketServer

import json, base64

import _mysql

db = _mysql.connect('localhost', 'root', '', 'vatic')

WAITING = 0
PROCESSING = 1

import socket
TRACKER_TCP_IP = '127.0.0.1'
TRACKER_TCP_PORT = 1590
BUFFER_SIZE = 1024
# MESSAGE = "0 7 1 2 3 4 5 6 8 458.00 265.00 579.00 257.00 562.00 332.00 451.00 340.00 440.00 220.00 547.00 215.00 432.00 297.00"

# tracker_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
# tracker_socket.connect((TRACKER_TCP_IP, TRACKER_TCP_PORT))
# s.send(MESSAGE)
# data = s.recv(BUFFER_SIZE)
# s.close()

# print "received data:", data




# agreement constants with server
# client -> server
NEW_LABELS = 'a'
FRAME_OK = 'b'
# server -> client
NEW_IMAGE = 'c'
SEEK_FRAME = 'd'




class VaticServer(WebSocket):

	curState = WAITING

	def handleNewPoints(self, data):
		

		str_xys   = ""
		num_points = len(data['tracks'])

		# print("------------------------------------")
		# print("------------------------------------")
		# print("------------------------------------")
		con = _mysql.connect('localhost', 'root', '', 'vatic')

		point_inds = ""
		for labels in data['tracks']:
			# print("aaaa")
			# get label index
			con.query("select text from labels where id=%s" % labels['label'])
			res = con.store_result()
			# print("aaaa")
			if (res.num_rows() == 0): # no such point in db
				num_points = num_points - 1
				continue
			# print("aaaa")
			label_name = res.fetch_row()[0][0]
			# print("aaaa")
			point_inds += " %s" % label_name[len(label_name) - 1] # assumes points are named something like Point3
			tmp = "%.2f %.2f " % (labels[str('position')][str('x')], labels[str('position')][str('y')])
			# print("aaaa11")
			str_xys = str_xys + (str( tmp))

			# print(labels[str('label')])

		tracker_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
		tracker_socket.connect((TRACKER_TCP_IP, TRACKER_TCP_PORT))
		tracker_socket.send("%d %d %s %s" % (data['frame'] + 1, num_points, point_inds, str_xys))
		img_size_buff = tracker_socket.recv(4)
		img_size = (ord(img_size_buff[0]) << 24) + (ord(img_size_buff[1]) << 16) + (ord(img_size_buff[2]) << 8)+ (ord(img_size_buff[3]))
		print(img_size)
		cont = tracker_socket.recv(img_size)
		tracker_socket.close()
		#args = "/home/user/ObjRecognition/build/client  %d %d %s %s" % (data['frame'], num_points, point_inds, str_xys)

		# print(args)
		# print("------------------------------------")
		# print("------------------------------------")
		# print("------------------------------------")
		# os.system(args)



		# f = open('/home/user/ObjRecognition/build/dartpose.jpg', 'rb')
		# cont = f.read()
		b64img = base64.b64encode(cont)
		self.sendMessage(NEW_IMAGE + b64img)

	def handleFrameOkayed(self):
		self.sendMessage(SEEK_FRAME + "{frame:100}")

	def handleMessage(self):

		if self.curState == PROCESSING:
			return
		self.curState = PROCESSING

		if self.data is None:
			return

		if self.data[0] == ord(NEW_LABELS):
			# print("aaaaa")
			# print(self.data)
			# print(str(self.data)[1:])
			data = json.loads(str(self.data)[1:])
			self.handleNewPoints(data)		

		if self.data[0] == ord(FRAME_OK):
			self.handleFrameOkayed()

		self.curState = WAITING
		# return cont

		# try:
		# 	self.sendMessage(str(self.data))
		# except Exception as n:
		# 	print n
	     
	def handleConnected(self):
		print self.address, 'connected'

	def handleClose(self):
		print self.address, 'closed'


def runServer():
	server = SimpleWebSocketServer("", 8532, VaticServer)

	def close_sig_handler(signal, frame):
		server.close()
		sys.exit()

	signal.signal(signal.SIGINT, close_sig_handler)

	server.serveforever()

if __name__ == "__main__":
    runServer()
