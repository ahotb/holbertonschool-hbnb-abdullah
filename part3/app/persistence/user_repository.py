# Legacy user repository .
class UserRepository:
    def __init__(self):
        self.users = []

    def add_user(self, user):
        self.users.append(user)

    def all(self):
        return self.users
