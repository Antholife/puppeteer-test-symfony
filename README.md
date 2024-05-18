Before, you start, make sure you have the following installed:
- Node.js
- npm

To install the dependencies, run the following command:
```npm install```

To run the tests, simply execute the following command:
```npm run test```

The tests use the address of the local Symfony server: http://127.0.0.1:8000. Make sure your Symfony server is running locally on port 8000 before running the tests.

For the tests to function correctly, you'll need to connect a database to the Symfony project. This requires adding the connection information for the test database to the .env file.

Additionally, the tests are designed to run in a specific order, and it's important for them to execute in this order for proper functionality. Please avoid rearranging the order.

Faker was used to generate random data, and chalkJS was used for console coloring.

While it would have been preferable to use Jest for unit tests instead of "assert", its usage was not permitted in this context.