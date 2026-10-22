# ElectroShop

**A cross-platform electronics shopping application built with React Native, Expo, and FastAPI.**

ElectroShop aims to simplify electronics shopping by providing a platform where customers can explore products, compare options, manage wishlists, and track orders. The project is being developed with a modular frontend and backend architecture.


## Features

### Customer Features

- Browse electronics such as smartphones, laptops, desktops, and cameras.
- View product details, pricing, and stock availability.
- Search and compare products.
- Manage a shopping cart and wishlist.
- User authentication and profile management.
- View order history and order status.
- Product ratings and reviews.

### Seller Features

- Add and manage products.
- Update product details, prices, and stock.
- Manage product availability.
- Configure return and refund eligibility.

### Planned Features

- Barcode scanning for product identification.
- Online payments and GST invoices.
- Smart product recommendations.
- Budget-based shopping suggestions.
- Visual product search.
- Product comparison assistance.
- Return and refund management.

## Tech Stack

| Layer           | Technology       |
| --------------- | ---------------- |
| Frontend        | React Native     |
| Development     | Expo             |
| Language        | TypeScript       |
| Backend         | Python, FastAPI  |
| Database        | To be configured |
| Authentication  | Planned          |
| Version Control | Git and GitHub   |

## Project Structure

```text
DEV-/
├── frontend/
│   ├── assets/
│   ├── src/
│   │   └── screens/
│   ├── App.tsx
│   ├── app.json
│   ├── index.ts
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
│
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   ├── main.py
│   └── requirements.txt
│
├── .gitignore
├── LICENSE
└── README.md
```

_The structure may evolve as development progresses._

## Getting Started

### Prerequisites

Install the following tools before starting:

- [Node.js](https://nodejs.org/)
- [Python](https://www.python.org/)
- [Git](https://git-scm.com/)
- [Expo Go](https://expo.dev/go/) for testing on a compatible mobile device, or an emulator.

### 1. Clone the Repository

```bash
git clone https://github.com/adityaraj3532/DEV-.git
cd DEV-
```

### 2. Set Up the Frontend

```bash
cd frontend
npm install
npx expo start
```

To run the web version, use:

```bash
npx expo start --web
```

### 3. Set Up the Backend

Open a separate terminal from the repository root:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install the backend dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI development server:

```bash
uvicorn main:app --reload
```

Once the backend is configured, the API documentation will be available at:

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

**Note:** The backend needs a FastAPI application in `main.py` and the required packages in `requirements.txt` before it can start successfully.

## 🔗 Frontend and Backend Integration

The frontend will communicate with the backend through REST APIs.

```text
Customer
   ↓
React Native + Expo
   ↓ HTTP Requests
FastAPI Backend
   ↓
Database
```

The API base URL depends on where the app runs. For a physical mobile device, use your computer's local network IP address instead of `127.0.0.1`.

## Development Guidelines

- Keep frontend and backend code separate.
- Use reusable components and modular services.
- Validate user input on both the frontend and backend.
- Never commit passwords, API keys, or secret environment variables.
- Write clear commit messages.
- Test changes before opening a pull request.

## Roadmap

- [x] Initialize the frontend project.
- [x] Organize the repository for frontend and backend development.
- [ ] Build product listing and product details screens.
- [ ] Create FastAPI endpoints.
- [ ] Integrate a database.
- [ ] Implement authentication.
- [ ] Add cart, wishlist, and order management.
- [ ] Add payment and invoice support.
- [ ] Develop smart shopping features.
- [ ] Test and deploy the application.

## Contributing

Contributions, suggestions, and bug reports are welcome.

1. Fork the repository.
2. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature
   ```

3. Make your changes and test them.
4. Commit your changes:

   ```bash
   git add .
   git commit -m "feat: describe your change"
   ```

5. Push your branch:

   ```bash
   git push -u origin feature/your-feature
   ```

6. Open a pull request.

## License

This project is distributed under the license included in the repository. See [LICENSE](LICENSE) for details.

---

**ElectroShop** — Making electronics shopping smarter and simpler.
