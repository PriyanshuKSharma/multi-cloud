from mangum import Mangum
from main import app

# This is the entry point for AWS Lambda
handler = Mangum(app, lifespan="off")
