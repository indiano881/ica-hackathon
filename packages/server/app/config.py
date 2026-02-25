from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    couchbase_connection_string: str = "couchbase://localhost"
    couchbase_username: str = "admin"
    couchbase_password: str = "password"
    couchbase_bucket: str = "ica-checkout"
    port: int = 3000

    model_config = {"env_file": ".env"}


settings = Settings()
