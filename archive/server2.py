from flask import Flask, request, render_template
from flask_cors import CORS, cross_origin
import json
import threading
import time
import requests

api = Flask(__name__)
CORS(api)


def antiSleep():

  while True:
    time.sleep(10)

    data = json.dumps('i dont sleep')
    #print(data)
    payload = data
    headers = {"Content-Type": "application/json"}

    url = "https://cookie-1.risalahqz.repl.co/antiSleep"

    payload = ""
    response = requests.request("GET", url, data=payload)


def writeDatabase(save):
  database = open(r"leaderboard.json", "w")
  database.write(json.dumps(save))
  database.close()


def loadDatabase():
  database = open(r"leaderboard.json", "r")
  tempdata = json.loads(database.read())  #dict database
  database.close()
  return tempdata


def sortBoard(data):
  leaderboard = []
  for x in data:
    temp = []
    temp.append(x["cookie"])
    temp.append(x["username"])
    leaderboard.append(temp)
  leaderboard.sort()
  leaderboard.reverse()
  return leaderboard


@api.route("/", methods=["POST"])
def calcsort():
  save = sortBoard(json.loads(request.data))
  writeDatabase(save)
  #print(save)
  return "succes"


@api.route("/showLeaderboard", methods=["POST"])
def showLeaderboard():
  print("yeah", json.dumps(loadDatabase()))
  return json.dumps(loadDatabase())


t = threading.Thread(target=antiSleep)
t.start()
api.run(host="0.0.0.0", port=8080, debug=True)
