Follow these steps to run the integration tests locally:

**1. Export the required database variables:**

```export TEST_DB_HOST=127.0.0.1```\
```export TEST_DB_PORT=```\
```export TEST_DB_USERNAME=```\
```export TEST_DB_PASSWORD=```\
```export TEST_DB_NAME=```

**2. Run docker compose**

```docker-compose -f docker-compose.test.yml up -d```

**3. Execute the integration tests with pytest**

For Example:

```pytest tests/services/test_include_exclude.py```

**Tip:**\
After testing, you can stop the container:

```docker compose -f docker-compose.test.yml down```