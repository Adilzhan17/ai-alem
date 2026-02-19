# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies (e.g. for psycopg2)
# gcc and libpq-dev are often needed for building psycopg2, though binary usually works.
# But just in case, adding essentials.
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code into the container
COPY . .

# Expose port 8000
EXPOSE 8000

# Command to run the application
# Assume app/main.py is the entry point
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
