from flask import Flask, request, render_template
from flask_cors import CORS, cross_origin
import json
import threading
import time
import requests
#json.dump  --[save]
#json.load --[load]

#format json
#{account:
#[{username:username,
#password:password,
#cookie:cookie}]}
serverStatus = 1
dataCache = []


def writeDatabase(save):
  database = open(r"database.json", "w")
  for x in save["account"]:
    if type(x["cookie"]) != type(12):
      x["cookie"] = 1
  database.write(json.dumps(save))
  database.close()


def loadDatabase():
  database = open(r"database.json", "r")
  tempdata = json.loads(database.read())  #dict database
  database.close()
  return tempdata


def antikaisan(database):
  for x in database["account"]:
    #print(x["cookie"])
    if type(x["cookie"]) != type(5):
      x["cookie"] = 1
  writeDatabase(database)
  return loadDatabase()


def userfinder(database, name):
  indeks = 0
  for x in database.keys():
    if x == "account":
      break
  for i in database[x]:

    if i["username"] == name:
      return "found", indeks
    indeks += 1
  return "not found", indeks - 1


def userFinderLogin(database, name, password):
  indeks = 0
  for x in database.keys():
    if x == "account":
      break
  for i in database[x]:

    if i["username"] == name and i["password"] == password:
      return "found", indeks
    indeks += 1
  return "not found", indeks


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


def updateLeaderboard():
  try:
    data = loadDatabase()
    antikaisan(data)
    save = sortBoard(data["account"])
    with open(r"leaderboard.json", "w") as database:
      database.write(json.dumps(save))
  except Exception as e:
    print("Leaderboard update error:", e)


def sendLeaderboard():
  while True:
    time.sleep(7)
    updateLeaderboard()


api = Flask(__name__)
api.config['TEMPLATES_AUTO_RELOAD'] = True


#----------website below------------------#
#CORS(api)
@api.route("/antiSleep", methods=["GET"])
def sleepReceive():
  return "dont sleep"


@api.route("/", methods=["GET"])
def landing_page():
  global serverStatus
  if serverStatus == 1:
    return render_template("index.html")
  elif serverStatus == 0:
    return render_template("error.html")


@api.route("/login", methods=["GET"])
def login_page():
  if serverStatus == 1:
    return render_template("login.html")
  elif serverStatus == 0:
    return render_template("error.html")


@api.route("/register", methods=["GET"])
def register_page():
  if serverStatus == 1:
    return render_template("register.html")
  elif serverStatus == 0:
    return render_template("error.html")


@api.route("/cookie", methods=["GET"])
def cookie_page():
  if serverStatus == 1:
    return render_template("cookie.html")
  elif serverStatus == 0:
    return render_template("error.html")


@api.route("/leaderboard", methods=["GET"])
def leaderboard_page():
  if serverStatus == 1:
    return render_template("leaderboard.html")
  elif serverStatus == 0:
    return render_template("error.html")


#----------operation below------------------#
@api.route("/registers", methods=["POST"])  #{request:[username,password]}
def register():

  tempdata = loadDatabase()  #dict database

  tempregis = json.loads(request.data)
  tempname = tempregis["request"][0]
  temppass = tempregis["request"][1]
  find_user, indeks = userfinder(tempdata, tempname)
  if find_user == "not found":
    tempdict = {}
    tempdict.update({"username": tempname, "password": temppass, "cookie": 0})
    tempdata["account"].append(tempdict)
    writeDatabase(tempdata)
    return json.dumps({"respond": "succes"})
  elif find_user == "found":
    return json.dumps({"respond": "existed"})


@api.route("/logins", methods=["POST"])  #{request:[username,password]}
def login():

  tempdata = loadDatabase()  #dict database

  templogin = json.loads(request.data)
  tempname = templogin["request"][0]
  temppass = templogin["request"][1]
  find_user, indeks = userFinderLogin(tempdata, tempname, temppass)
  if find_user == "not found":
    return json.dumps({"respond": "not found"})
  elif find_user == "found":
    accObj = tempdata["account"][indeks]

    return json.dumps({"respond": (accObj["cookie"])})


@api.route("/sendCookies",
           methods=["POST"])  #{request:[username,password,cookie]} every 5 sec
def send_cookies():

  tempdata = loadDatabase()  #dict database
  tempuser = json.loads(request.data)
  tempname = tempuser["request"][0]
  temppass = tempuser["request"][1]
  tempcookie = tempuser["request"][2]
  if type(tempcookie) != type(12):
    return "not now :)"
  if tempcookie > 50000:
    tempcookie = 50000
  find_user, indeks = userfinder(tempdata, tempname)
  tempdata["account"][indeks]["cookie"] += tempcookie
  if tempdata["account"][indeks]["cookie"] < 0:
    tempdata["account"][indeks]["cookie"] = 0
  writeDatabase(tempdata)
  return json.dumps({"respond": "succes"})


@api.route("/showCookies", methods=["POST"])  #{request:[username,password]}
def show_cookies():

  tempdata = loadDatabase()  #dict database
  tempuser = json.loads(request.data)
  tempname = tempuser["request"][0]
  temppass = tempuser["request"][1]
  find_user, indeks = userfinder(tempdata, tempname)

  if find_user == "not found":
    return json.dumps({"respond": "not found"})
  return json.dumps({"respond": tempdata["account"][indeks]["cookie"]})


@api.route("/giveCookies",
           methods=["POST"])  #{request:[username,amount,targetname]}
def give_cookies():

  tempdata = loadDatabase()  #dict database
  tempuser = json.loads(request.data)
  tempname = tempuser["request"][0]
  tempcookie_give = tempuser["request"][1]
  temptarget = tempuser["request"][2]
  find_user, indeks = userfinder(tempdata, tempname)
  target_user, target_indeks = userfinder(tempdata, temptarget)
  print(tempdata["account"][indeks]["cookie"])
  print(tempdata["account"][target_indeks]["cookie"])
  print(tempcookie_give, type(tempcookie_give))
  try:
    tempcookie_give = int(tempcookie_give)
  except:
    return json.dumps({"respond": "failed"})

  if find_user == "found" and target_user == "found":

    if tempcookie_give <= tempdata["account"][indeks]["cookie"]:
      tempdata["account"][target_indeks]["cookie"] += tempcookie_give
      tempdata["account"][indeks]["cookie"] -= tempcookie_give
      writeDatabase(tempdata)
      return json.dumps(
        {"respond": ["succes", tempdata["account"][indeks]["cookie"]]})
  return json.dumps({"respond": "failed"})


@api.route("/showLeaderboard", methods=["GET", "POST"])
def showLeaderboard():
  try:
    with open(r"leaderboard.json", "r") as database:
      tempdata = json.loads(database.read())
    return json.dumps(tempdata)
  except Exception:
    updateLeaderboard()
    try:
      with open(r"leaderboard.json", "r") as database:
        tempdata = json.loads(database.read())
      return json.dumps(tempdata)
    except Exception:
      return json.dumps([])


if __name__ == "__main__":
  t = threading.Thread(target=sendLeaderboard, daemon=True)
  t.start()
  api.run(host="0.0.0.0", port=8080, debug=False)
