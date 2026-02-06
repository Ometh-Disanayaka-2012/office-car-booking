# Office Fleet - React Car Booking System

A modern React application for office car booking management with Firebase backend, featuring role-based access control, real-time updates, and comprehensive fleet management.

## 🚀 Features

### For Employees
- **Browse Cars**: View available vehicles with driver information
- **Book Cars**: Schedule bookings with date/time selection
- **Manage Bookings**: View, start, and end trips
- **Real-time Updates**: See live availability status

### For Administrators
- **Fleet Management**: Add, edit, and delete vehicles
- **Driver Management**: Manage drivers and car assignments (one driver per car)
- **Booking Oversight**: View and manage all bookings
- **Dashboard Analytics**: Monitor fleet utilization

## 🛠️ Tech Stack

- **React** 18.2.0 - Frontend framework
- **React Router DOM** 6.20.0 - Client-side routing
- **Firebase** 10.7.1 - Backend (Firestore + Authentication)
- **CSS3** - Styling (no external CSS frameworks)

## 📁 Project Structure

```
car-booking-react/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── BookingModal.js
│   │   ├── Bookings.js
│   │   ├── CarCard.js
│   │   ├── CarModal.js
│   │   ├── Cars.js
│   │   ├── Dashboard.js
│   │   ├── DriverModal.js
│   │   ├── Drivers.js
│   │   ├── Layout.js
│   │   └── Login.js
│   ├── contexts/
│   │   └── AuthContext.js
│   ├── services/
│   │   └── firebase.js
│   ├── styles/
│   │   ├── Bookings.css
│   │   ├── Cars.css
│   │   ├── Dashboard.css
│   │   ├── Drivers.css
│   │   ├── Layout.css
│   │   └── Login.css
│   ├── App.css
│   ├── App.js
│   ├── index.css
│   └── index.js
├── package.json
└── README.md
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 14+ and npm
- Firebase account

### Step 1: Clone/Download the Project

```bash
cd car-booking-react
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Click "Add app" → Web (</>) icon
4. Register your app and copy the config object

### Step 4: Configure Firebase

Open `src/services/firebase.js` and replace the config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Step 5: Enable Firestore Database

1. In Firebase Console → Build → Firestore Database
2. Click "Create database"
3. Choose production mode
4. Select a location

### Step 6: Set Up Firestore Security Rules

Go to Firestore → Rules and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if request.auth.uid == userId || isAdmin();
    }
    
    match /cars/{carId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    match /drivers/{driverId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    match /bookings/{bookingId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && 
                      (resource.data.userId == request.auth.uid || isAdmin());
      allow delete: if isAdmin();
    }
  }
}
```

### Step 7: Enable Authentication

1. Firebase Console → Build → Authentication
2. Click "Get started"
3. Enable "Email/Password" provider
4. Add test users or create via the app

### Step 8: Create Initial User Documents

In Firestore, create a `users` collection with documents:

**Admin User (document ID should match Auth UID):**
```json
{
  "email": "admin@company.com",
  "name": "Admin User",
  "role": "admin",
  "createdAt": "2024-02-03T00:00:00.000Z"
}
```

**Employee User (document ID should match Auth UID):**
```json
{
  "email": "employee@company.com",
  "name": "John Doe",
  "role": "employee",
  "createdAt": "2024-02-03T00:00:00.000Z"
}
```

### Step 9: Run the Application

```bash
npm start
```

The app will open at `http://localhost:3000`

## 📊 Database Collections

### `users`
```javascript
{
  uid: "user_id",
  email: "user@company.com",
  name: "User Name",
  role: "admin" | "employee",
  createdAt: "ISO timestamp"
}
```

### `cars`
```javascript
{
  model: "Toyota Camry",
  plate: "ABC-1234",
  seats: 5,
  driverId: "driver_id" // optional
}
```

### `drivers`
```javascript
{
  name: "Michael Johnson",
  phone: "555-0101",
  license: "DL12345",
  carId: "car_id" // optional
}
```

### `bookings`
```javascript
{
  carId: "car_id",
  userId: "user_id",
  userName: "John Doe",
  startDate: "2024-02-03T09:00:00",
  endDate: "2024-02-03T17:00:00",
  purpose: "Client meeting",
  status: "active" | "completed" | "cancelled",
  tripStarted: false,
  tripStartTime: "ISO timestamp", // optional
  tripEndTime: "ISO timestamp", // optional
  createdAt: "ISO timestamp"
}
```

## 🎯 Usage

### Employee Workflow
1. Login with credentials
2. Navigate to "Cars" page
3. Click "Book Now" on available car
4. Select dates and submit
5. Go to "My Bookings"
6. Click "Start Trip" when ready
7. Click "End Trip" when done

### Admin Workflow
1. Login with admin credentials
2. Add cars via "Cars" page
3. Add drivers via "Drivers" page
4. Assign drivers to cars
5. Monitor all bookings in "All Bookings"

## 🔒 Security

- Protected routes with authentication
- Role-based access control (RBAC)
- Firestore security rules
- Client-side route protection
- Secure Firebase initialization

## 🚀 Deployment

### Firebase Hosting

```bash
npm run build
npm install -g firebase-tools
firebase login
firebase init hosting
# Select your project
# Use 'build' as public directory
# Configure as single-page app: Yes
firebase deploy
```

### Other Hosting Options

- **Vercel**: Connect GitHub repo and deploy
- **Netlify**: Drag & drop build folder
- **AWS S3**: Upload build folder to S3 bucket

## 🛠️ Customization

### Styling
Colors are defined in `src/App.css`:
```css
:root {
  --primary: #0F172A;
  --accent: #F59E0B;
  /* Modify these to match your branding */
}
```

### Features to Add
- Email notifications (Firebase Cloud Functions)
- SMS reminders (Twilio integration)
- Calendar integration
- GPS tracking
- Maintenance schedules
- Fuel tracking
- Reporting dashboard
- Export to PDF/Excel

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🐛 Troubleshooting

### Firebase Connection Issues
- Check network configuration
- Verify Firebase config in `firebase.js`
- Check Firebase project status

### Authentication Problems
- Ensure Email/Password is enabled
- Check user documents exist in Firestore
- Verify security rules

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📝 Demo Credentials

For testing (create these users in Firebase Auth):
- **Admin**: admin@company.com / admin123
- **Employee**: employee@company.com / employee123

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

MIT License - Free to use and modify

## 🆘 Support

For issues or questions:
- Check Firebase Console for errors
- Review browser console for debugging
- Check Firestore security rules
- Verify Firebase configuration

## 🔮 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] Advanced analytics
- [ ] Maintenance tracking
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Calendar view
- [ ] Expense tracking
- [ ] Driver ratings
- [ ] Vehicle inspection logs

---

Built with ❤️ using React and Firebase
