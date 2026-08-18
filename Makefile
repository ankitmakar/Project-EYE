.PHONY: help setup dev-backend dev-frontend test seed attack docker-up docker-down lint clean

help:
	@echo "Project EYE — SOC-in-a-Box Command Center"
	@echo "=========================================="
	@echo "make setup         - Install backend and frontend dependencies"
	@echo "make dev-backend   - Run the FastAPI backend in dev mode"
	@echo "make dev-frontend  - Run the React frontend in dev mode"
	@echo "make seed          - Seed initial users, rules, alerts, and events"
	@echo "make attack        - Run real-time attack simulation"
	@echo "make test          - Run backend unit and integration tests"
	@echo "make docker-up     - Launch all services with Docker Compose"
	@echo "make docker-down   - Stop Docker Compose services"
	@echo "make clean         - Clean cache and temporary files"

setup:
	@echo "Installing backend dependencies..."
	pip install -r backend/requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

dev-backend:
	cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && npm run dev

seed:
	python scripts/seed_db.py

attack:
	python scripts/simulate_attacks.py

test:
	cd backend && python -m pytest tests/ -v

docker-up:
	docker-compose up -d --build

docker-down:
	docker-compose down

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
