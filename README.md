# ♿ Wheelchair-Friendly Bus Travel App

## 🚀 Project Overview
This mobile app is designed to assist **wheelchair users** in traveling independently and confidently using **public bus transportation**.  

The app helps passengers:
- Select **From** and **To** locations.
- Find **nearby accessible bus stops** from the chosen start location.
- View **next available buses** with timings and fare details.
- Send a **notification to the bus conductor app** about their boarding, ensuring assistance and preparedness.
- Track their journey **in real time** until they reach their destination.

This project focuses on **inclusivity and accessibility**, enabling wheelchair users to experience smoother, safer, and more convenient travel.

---

## 🛠️ Tech Stack
- **Frontend (Mobile App):**
  - React Native (Expo)
  - TypeScript
  - Expo Router
  - Tailwind CSS (for styling)

- **Backend:**
  - Node.js
  - Express.js
  - REST API

- **Database:**
  - MySQL

- **Other Tools:**
  - Git & GitHub (version control)
  - ESLint & Prettier (code quality)

---

## 📂 Folder Structure
```

Wheel\_Chair\_Project/
├── app/                 # Expo app entry and routes
├── assets/              # Images, icons, fonts
├── components/          # Reusable UI components
├── screens/             # React Native screens
├── backend/             # Node.js + Express backend
│   ├── routes/          # API route definitions
│   ├── controllers/     # Request handling logic
│   ├── services/        # Business logic
│   ├── models/          # MySQL models
│   └── index.js         # Backend entry point
├── constants/           # Config & constants
├── hooks/               # Custom React hooks
├── package.json         # Frontend dependencies
├── README.md            # Project documentation
└── .gitignore           # Ignored files & folders

````

---

## ⚙️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-username/Wheel_Chair_Project.git
cd Wheel_Chair_Project
````

### 2. Install dependencies

**Frontend (Expo App):**

```bash
cd app
npm install
```

**Backend (Node.js):**

```bash
cd backend
npm install
```

### 3. Configure Database

* Install [MySQL](https://dev.mysql.com/downloads/).
* Create a database (example: `wheelchair_db`).
* Update your `backend/config/db.js` with database credentials.

### 4. Run the app

**Backend server:**

```bash
cd backend
npm start
```

**Frontend app:**

```bash
cd app
npx expo start
```

---

## 🌟 Features

* 🔍 **Nearby bus stops** detection based on location.
* 🚌 **Real-time bus schedules** with fare details.
* 📲 **Passenger-to-conductor notifications** for wheelchair boarding.
* 📍 **Live location tracking** during the journey.
* 🌐 **Multiplatform support** (Android & iOS via Expo).

---

## 🤝 Contributing

Contributions are welcome!
If you’d like to improve the project:

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/NewFeature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push branch (`git push origin feature/NewFeature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the **MIT License** — feel free to use, modify, and distribute.

---

## 🏷️ Tags

`react-native` `expo` `typescript` `nodejs` `express` `mysql` `accessibility` `transportation` `wheelchair` `bus-travel` `inclusivity` `assistive-technology`

---

## ❤️ Acknowledgements

This project is inspired by the vision of creating **inclusive smart mobility solutions** for wheelchair users and promoting **equal access to public transportation**.


Would you like me to also create a **short version of the README** (just for GitHub front page appeal) along with this detailed one?
```
