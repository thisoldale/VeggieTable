# Garden Planner

Garden Planner is a full-stack web application designed to help users plan and manage their gardens. It provides tools for managing a personal plant library, creating detailed garden plans, and tracking tasks.

## Features

*   **User Authentication**: Secure user registration and login system.
*   **Plant Library**: Manage a personal library of plants with detailed information about each plant.
*   **CSV Import/Export**: Easily import and export your plant library from/to CSV files, with support for column mapping.
*   **Garden Plans**: Create and manage multiple garden plans.
*   **Task Management**: Keep track of gardening tasks associated with your plans.
*   **Responsive UI**: A modern, responsive user interface built with React and Tailwind CSS.

## Tech Stack

*   **Frontend**:
    *   React
    *   TypeScript
    *   Vite
    *   Tailwind CSS
    *   Redux Toolkit (for state management and data fetching)
    *   React Router
    *   React Hot Toast (for notifications)
*   **Backend**:
    *   Python
    *   FastAPI
    *   SQLAlchemy
    *   SQLite
    *   JWT (for authentication)
*   **Containerization**:
    *   Docker
    *   Docker Compose

## Getting Started

### Prerequisites

*   Docker
*   Docker Compose

### Installation and Running the Application

1.  **Clone the repository**:
    ```sh
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Run the application with Docker Compose**:
    The application is fully containerized and can be run with a single command.

    ```sh
    docker compose up --build
    ```

    This will build the Docker images for the frontend and backend services and start the application.

3.  **Access the application**:
    Once the containers are running, you can access the application in your web browser at:
    [http://localhost:8444](http://localhost:8444)

    The backend API will be available at `http://localhost:8445`.
