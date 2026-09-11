from app.core.database import ping_database


class FakeAdmin:
    def command(self, command_name):
        assert command_name == "ping"
        return {"ok": 1.0}


class FakeClient:
    admin = FakeAdmin()


def test_ping_database_returns_true_when_mongodb_responds():
    assert ping_database(FakeClient()) is True