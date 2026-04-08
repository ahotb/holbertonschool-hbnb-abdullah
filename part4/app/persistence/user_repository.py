#part3/app/persistence/user_repository.py
class UserRepository:
    def __init__(self):
        self.users = []

    def add_user(self, user):
        self.users.append(user)

    def all(self):
        return self.users
