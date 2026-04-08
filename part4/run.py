#part3/run.py
from app import create_app
from app.api import create_api
from config import DevelopmentConfig
from flask import render_template

app = create_app(DevelopmentConfig)
api = create_api(app)


@app.route("/index.html")
def index():
    return render_template("index.html")


@app.route("/login.html")
def login_page():
    return render_template("login.html")


@app.route("/place.html")
def place_page():
    return render_template("place.html")


@app.route("/add_review.html")
def add_review_page():
    return render_template("add_review.html")


# Flask-RESTX registers endpoint "root" on "/".
# Reuse it to serve the frontend home page instead of returning 404.
app.view_functions["root"] = index


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)

