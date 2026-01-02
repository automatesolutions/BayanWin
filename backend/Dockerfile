FROM python:3.11-slim

WORKDIR /app

# Install system dependencies including Node.js
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt /app/requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy package.json and install Node.js dependencies
COPY package.json /app/package.json
RUN npm install

# Copy application code
COPY . /app/

# Expose port
EXPOSE $PORT

# Start command
CMD python3 -m uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}

