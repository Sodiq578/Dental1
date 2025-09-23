// Initial users data for localStorage
const initialUsers = [
  { id: 1, name: "Nargiza", email: "nargiza@example.com", password: "123", patientId: 1 },
  { id: 2, name: "Ali", email: "ali@example.com", password: "456", patientId: 2 },
  // Add more users as needed
];

// Other initial data (example, expand as needed)
const initialPatients = [
  { id: 1, name: "Nargiza", age: 30, gender: "Female", phone: "+998901234567" },
  { id: 2, name: "Ali", age: 25, gender: "Male", phone: "+998908765432" },
];

const initialAppointments = [
  { id: 1, patientId: 1, date: "2025-09-20", description: "Dental checkup" },
  { id: 2, patientId: 1, date: "2025-09-25", description: "Tooth filling" },
  { id: 3, patientId: 2, date: "2025-09-22", description: "Cleaning" },
];

const initialBillings = [
  { id: 1, patientId: 1, amount: 50000, date: "2025-09-20" },
  { id: 2, patientId: 1, amount: 75000, date: "2025-09-25" },
];

// Save data to localStorage
export const saveToLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Retrieve data from localStorage
export const getFromLocalStorage = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error(`Error retrieving ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// Initialize data in localStorage if not already present
export const initializeData = () => {
  if (!localStorage.getItem("users")) {
    saveToLocalStorage("users", initialUsers);
  }
  if (!localStorage.getItem("patients")) {
    saveToLocalStorage("patients", initialPatients);
  }
  if (!localStorage.getItem("appointments")) {
    saveToLocalStorage("appointments", initialAppointments);
  }
  if (!localStorage.getItem("billings")) {
    saveToLocalStorage("billings", initialBillings);
  }
  // Add other data initializations (e.g., medications, inventory, staff) as needed
};