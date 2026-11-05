import React, { useState, useEffect, useRef } from "react";
import {
  ClipboardCheck,
  BookOpen,
  Camera,
  Plus,
  Building2,
  CalendarDays,
  CheckCircle2,
  Circle,
  Image as ImageIcon,
  Loader2,
  Handshake,
  Wallet,
  HardHat,
  Gavel,
  Trash2,
  Paperclip,
  X,
  Users,
  Info,
  ArrowLeft,
  ArrowRight,
  Phone,
  MapPin,
  Edit as EditIcon,
  FileText,
  Printer,
  Settings as SettingsIco,
  CheckSquare,
  ShieldCheck,
  LogOut,
  UserPlus,
  FolderPlus,
  Lock,
  Unlock,
  Sun,
  FileSpreadsheet,
  CheckCircle,
  FolderOpen,
  Wrench,
  Download,
  CloudSun,
  AlertTriangle,
  FileUp,
  AlertOctagon,
  Clock,
  AlertCircle,
  Search,
  Thermometer,
  Maximize2,
  Receipt,
  Layers,
  TrendingUp,
  ChevronRight,
  Filter
} from "lucide-react";

import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  getDoc,
  getDocs,
} from "firebase/firestore";

// =====================================================================
// INICJALIZACJA FIREBASE (100% ZGODNOŚCI Z TWOJĄ BAZĄ)
// =====================================================================
const firebaseConfig = {
  apiKey: "AIzaSyBD4OTs8oIApUkk8bUh6iIiOO_x4zQkVGo",
  authDomain: "nadzorbudowlany-2cc37.firebaseapp.com",
  projectId: "nadzorbudowlany-2cc37",
  storageBucket: "nadzorbudowlany-2cc37.firebasestorage.app",
  messagingSenderId: "775098190513",
  appId: "1:775098190513:web:886a7b1cbf0e9526af3090",
};

const appId = "wspolna_baza";

let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.warn("Brak kluczy Firebase lub błąd inicjalizacji.", error);
}

const DEFAULT_CHECKLISTS = {
  "Karta Startowa": [
    "Podpisana umowa z wycenionym zakresem robót",
    "Protokół przekazania frontu robót",
    "Oświadczenie BHP podpisane przez brygadzistę",
    "Dostarczone certyfikaty i deklaracje (DWU)",
    "Harmonogram dostaw głównych materiałów",
  ],
  "Stan Zero": [
    "Przejęcie tyczenia osi od geodety",
    "Ocena dna wykopu przed chudziakiem",
    "Odbiór zbrojenia: średnice, strzemiona, ciągłość, otulina",
    "Weryfikacja rzędnych posadowienia i przepustów instalacyjnych",
    "Izolacje przeciwwilgociowe i termiczne: ciągłość, grubość",
    "Odbiór drenażu opaskowego i zasypki filtracyjnej",
  ],
  "Stan Surowy Otwarty (SSO)": [
    "Weryfikacja pionów ścian, poziomów i kątów prostych",
    "Odbiór zbrojenia nadproży, słupów, podciągów i trzpieni",
    "Strop i wieńce: układ zbrojenia przed betonowaniem",
    "Kontrola wymiarów otworów okiennych i drzwiowych",
    "Drożność i pionowość przewodów kominowych i wentylacyjnych",
    "Więźba dachowa: przekroje, impregnacja, oparcie na murłacie, kotwienie",
  ],
  "Stan Surowy Zamknięty (SSZ)": [
    "Montaż stolarki okiennej (weryfikacja szczelności, ciepły montaż / taśmy)",
    "Montaż bramy garażowej i drzwi tymczasowych/docelowych",
    "Zamknięcie dachu (membrana, pokrycie, obróbki blacharskie, rynny)",
    "Wstępne uporządkowanie placu budowy po etapie konstrukcyjnym",
  ],
  "Instalacje Wewnętrzne": [
    "Weryfikacja tras prowadzenia (brak niedozwolonych bruzd w elementach nośnych)",
    "Próba ciśnieniowa instalacji wodnej i C.O. (protokół)",
    "Ogrzewanie podłogowe: rozstaw pętli, dylatacje brzegowe, izolacja",
    "Test drożności kanalizacji i weryfikacja spadków",
    "Pomiary rezystancji izolacji kabli i dokumentacja fotograficzna tras",
  ],
  "Tynki i Wylewki": [
    "Weryfikacja przygotowania podłoża pod tynki (gruntowanie, siatki na łączeniach)",
    "Odbiór pionów, płaszczyzn i kątów otynkowanych ścian",
    "Kontrola grubości, poziomu i dylatacji obwodowych wylewek",
    "Pomiary wilgotności wylewek (CM) przed pracami okładzinowymi",
  ],
  "Stan Deweloperski": [
    "Zakończenie prac elewacyjnych (kołkowanie, warstwa zbrojna, tynk, parapety)",
    "Montaż osprzętu elektrycznego i rozdzielnicy głównej",
    "Uruchomienie źródła ciepła (kocioł / pompa ciepła) i wygrzewanie jastrychu",
    "Próby szczelności i protokoły instalacji końcowych",
    "Niwelacja i uporządkowanie terenu zewnętrznego",
  ],
  "Prace Wykończeniowe (Pod klucz)": [
    "Gładzie i malowanie ścian oraz sufitów (kontrola w świetle bocznym)",
    "Montaż podłóg, listew przypodłogowych i stolarki drzwiowej wewnętrznej",
    "Biały montaż (armatura, ceramika sanitarna, silikonowanie)",
    "Biały montaż elektryczny i oprawy oświetleniowe",
    "Zabudowy meblowe / kuchnia",
  ],
  "Odbiory Końcowe": [
    "Przyłącze wod-kan (protokół odbioru z wodociągów)",
    "Przyłącze energetyczne i protokół pomiarów elektrycznych (5-letnich)",
    "Protokół odbioru kominiarskiego / wentylacji (rekuperacji)",
    "Geodezyjna inwentaryzacja powykonawcza",
    "Oświadczenie Kierownika Budowy o zakończeniu robót",
    "Zgłoszenie zakończenia budowy do PINB / Pozwolenie na użytkowanie",
  ],
};

const WEATHER_OPTIONS = [
  "☀️ Słonecznie",
  "⛅ Częściowe zachmurzenie",
  "🌧️ Opady deszczu",
  "❄️ Mróz / Opady śniegu",
  "💨 Silny wiatr",
];

const DOC_CATEGORIES = [
  "Projekt Techniczny",
  "Umowa / Aneks",
  "Atesty / DWU",
  "Protokół Odbioru",
  "Kosztorys / Faktura",
  "Inne",
];

const compressImage = (file, callback) => {
  try {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width,
          height = img.height;
        const MAX = 800;
        if (width > height && width > MAX) {
          height *= MAX / width;
          width = MAX;
        } else if (height > MAX) {
          width *= MAX / height;
          height = MAX;
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL("image/jpeg", 0.65));
      };
      img.onerror = () => callback(null);
      img.src = event.target.result;
    };
    reader.onerror = () => callback(null);
    reader.readAsDataURL(file);
  } catch (err) {
    callback(null);
  }
};

const loadDocumentAsBase64 = (file, callback) => {
  if (file.size > 700000) {
    alert("Plik jest zbyt duży! Maksymalny rozmiar dokumentu w bazie Firestore to ok. 700 KB.");
    callback(null);
    return;
  }
  const reader = new FileReader();
  reader.onload = (event) => {
    callback(event.target.result);
  };
  reader.onerror = () => callback(null);
  reader.readAsDataURL(file);
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(
    amount || 0
  );
const formatDateStr = (d) => d.toISOString().split("T")[0];
const parseLocal = (dStr) => {
  if (!dStr) return new Date();
  const parsed = new Date(dStr);
  if (!isNaN(parsed)) return parsed;
  if (dStr.includes(".")) {
    const parts = dStr.split(", ");
    const [DD, MM, YYYY] = parts[0].split(".");
    return new Date(`${YYYY}-${MM}-${DD}T${parts[1] || "00:00"}`);
  }
  return new Date();
};

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({
    role: "wykonawca",
    displayName: "",
    assignedProjects: [],
    permissions: {},
    editPermissions: {},
    agreementPermissions: { inwestor: true, budowa: true, rada: true },
    contractorScope: "",
    approved: false,
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState("");

  const [currentScreen, setCurrentScreen] = useState("home");
  const [activeTab, setActiveTab] = useState("info");

  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);

  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectBudget, setNewProjectBudget] = useState("");
  const [newProjectInvestor, setNewProjectInvestor] = useState("");
  const [newProjectLocation, setNewProjectLocation] = useState("");
  const [newProjectPhone, setNewProjectPhone] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [newProjectMapUrl, setNewProjectMapUrl] = useState("");

  const [logs, setLogs] = useState([]);
  const [customTemplates, setCustomTemplates] = useState({});
  const [checklists, setChecklists] = useState({});
  const [photos, setPhotos] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [costs, setCosts] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [offers, setOffers] = useState([]);
  const [delegations, setDelegations] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [issues, setIssues] = useState([]);

  // Lightbox do podglądu zdjęć w pełnej rozdzielczości
  const [lightboxImage, setLightboxImage] = useState(null);

  // Stany edycji wpisów
  const [editingLogId, setEditingLogId] = useState(null);
  const [editLogText, setEditLogText] = useState("");
  const [editingAgreementId, setEditingAgreementId] = useState(null);
  const [editAgreementText, setEditAgreementText] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskText, setEditTaskText] = useState("");
  const [editTaskDate, setEditTaskDate] = useState("");
  const [editingCostId, setEditingCostId] = useState(null);
  const [editCostDesc, setEditCostDesc] = useState("");
  const [editCostAmount, setEditCostAmount] = useState("");
  const [editCostCategory, setEditCostCategory] = useState("");
  const [editCostInvoice, setEditCostInvoice] = useState("");
  const [editCostPaid, setEditCostPaid] = useState(true);

  const [editingOfferId, setEditingOfferId] = useState(null);
  const [editOfferSupplier, setEditOfferSupplier] = useState("");
  const [editOfferDesc, setEditOfferDesc] = useState("");
  const [editOfferCostPrice, setEditOfferCostPrice] = useState("");
  const [editOfferInvestorPrice, setEditOfferInvestorPrice] = useState("");
  const [editOfferStatus, setEditOfferStatus] = useState("");

  const [editingInstId, setEditingInstId] = useState(null);
  const [editInstTitle, setEditInstTitle] = useState("");
  const [editInstAmount, setEditInstAmount] = useState("");

  // Dziennik - wzbogacony o pogodę, temperaturę i stan osobowy
  const [newLogText, setNewLogText] = useState("");
  const [newLogCustomDate, setNewLogCustomDate] = useState("");
  const [newLogPhotoBase64, setNewLogPhotoBase64] = useState(null);
  const [newLogWeather, setNewLogWeather] = useState("☀️ Słonecznie");
  const [newLogTemp, setNewLogTemp] = useState("15");
  const [newLogWorkersCount, setNewLogWorkersCount] = useState("");
  const [logSearchQuery, setLogSearchQuery] = useState("");

  const [agreementType, setAgreementType] = useState("inwestor");
  const [newAgreementText, setNewAgreementText] = useState("");
  const [newAgreementDate, setNewAgreementDate] = useState("");

  const [newTaskDate, setNewTaskDate] = useState("");
  const [newTaskText, setNewTaskText] = useState("");

  // Koszty - wzbogacone o nr faktury i status płatności
  const [newCostDate, setNewCostDate] = useState("");
  const [newCostAmount, setNewCostAmount] = useState("");
  const [newCostDesc, setNewCostDesc] = useState("");
  const [newCostCategory, setNewCostCategory] = useState("Materiały");
  const [newCostInvoice, setNewCostInvoice] = useState("");
  const [newCostIsPaid, setNewCostIsPaid] = useState(true);

  const [newInstTitle, setNewInstTitle] = useState("");
  const [newInstAmount, setNewInstAmount] = useState("");

  const [newOfferSupplier, setNewOfferSupplier] = useState("");
  const [newOfferDesc, setNewOfferDesc] = useState("");
  const [newOfferCostPrice, setNewOfferCostPrice] = useState("");
  const [newOfferInvestorPrice, setNewOfferInvestorPrice] = useState("");
  const [newOfferStatus, setNewOfferStatus] = useState("Oczekuje");

  // Zadania Delegowane
  const [newDelegationTitle, setNewDelegationTitle] = useState("");
  const [newDelegationDesc, setNewDelegationDesc] = useState("");
  const [newDelegationAssignee, setNewDelegationAssignee] = useState("");
  const [newDelegationDeadline, setNewDelegationDeadline] = useState("");

  // Dokumenty - wzbogacone o kategorię
  const [newDocName, setNewDocName] = useState("");
  const [newDocCategory, setNewDocCategory] = useState("Projekt Techniczny");
  const [isDocUploading, setIsDocUploading] = useState(false);
  const docInputRef = useRef(null);

  // Usterki (Punch-list) - wzbogacone o Priorytet i Lokalizację/Branżę
  const [newIssueTitle, setNewIssueTitle] = useState("");
  const [newIssueDesc, setNewIssueDesc] = useState("");
  const [newIssueAssignee, setNewIssueAssignee] = useState("");
  const [newIssuePriority, setNewIssuePriority] = useState("Normalny");
  const [newIssueLocation, setNewIssueLocation] = useState("");
  const [newIssuePhoto, setNewIssuePhoto] = useState(null);
  const issuePhotoRef = useRef(null);
  const [editingIssueId, setEditingIssueId] = useState(null);
  const [editIssueStatus, setEditIssueStatus] = useState("");
  const [editIssueNote, setEditIssueNote] = useState("");
  const [issueFilterStatus, setIssueFilterStatus] = useState("Wszystkie");

  // Filtrowanie w kalendarzu
  const [visibleUsersInCalendar, setVisibleUsersInCalendar] = useState([]);

  const [userToDelete, setUserToDelete] = useState(null);

  const [photoDesc, setPhotoDesc] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [isEditingChecklist, setIsEditingChecklist] = useState(false);
  const [newChecklistItemStage, setNewChecklistItemStage] = useState(null);
  const [newChecklistItemText, setNewChecklistItemText] = useState("");
  const [editingStageName, setEditingStageName] = useState(null);
  const [newStageNameInput, setNewStageNameInput] = useState("");
  const [newCategoryTitleInput, setNewCategoryTitleInput] = useState("");

  const [reportPeriod, setReportPeriod] = useState("miesiac");
  const [reportDateFrom, setReportDateFrom] = useState("");
  const [reportDateTo, setReportDateTo] = useState("");
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [reportConfig, setReportConfig] = useState({
    logs: true,
    agreementsInwestor: true,
    agreementsBudowa: true,
    agreementsRada: true,
    budget: true,
    checklists: true,
    photos: true,
    issues: true,
  });

  const [calendarView, setCalendarView] = useState("month");
  const [currentCalDate, setCurrentCalDate] = useState(new Date());

  const fileInputRef = useRef(null);
  const logPhotoRef = useRef(null);
  const COST_CATEGORIES = [
    "Materiały",
    "Robocizna",
    "Sprzęt",
    "Usługi zewn.",
    "Inne",
  ];

  useEffect(() => {
    if (!auth) {
      setIsAuthLoading(false);
      return;
    }

    const initAuth = async () => {
      if (typeof __initial_auth_token !== "undefined" && __initial_auth_token) {
        try {
          await signInWithCustomToken(auth, __initial_auth_token);
        } catch (err) {
          console.log("Zignorowano przestarzały token logowania.");
        }
      }
      setIsAuthLoading(false);
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email) {
        const userDocRef = doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "users_roles",
          currentUser.uid
        );
        const userSnap = await getDoc(userDocRef);

        const isAdminEmail =
          currentUser.email.toLowerCase() === "thomekch@gmail.com";

        if (userSnap.exists()) {
          const data = userSnap.data();
          let currentRole = data.role;
          let currentPerms = data.permissions || {};
          let currentEditPerms = data.editPermissions || {};
          let currentAgreementPerms = data.agreementPermissions || {
            inwestor: true,
            budowa: true,
            rada: true,
          };
          let contractorScope = data.contractorScope || "";
          let assignedProjects = data.assignedProjects || [];
          let approved = data.approved ?? false;

          if (isAdminEmail) {
            currentRole = "administrator";
            approved = true;
            currentPerms = {
              poranna: true, info: true, dziennik: true, ustalenia: true,
              harmonogram: true, finanse: true, checklisty: true, zdjecia: true,
              raporty: true, oferty: true, zadania: true, dokumenty: true, usterki: true
            };
            currentEditPerms = {
              poranna: true, info: true, dziennik: true, ustalenia: true,
              harmonogram: true, finanse: true, checklisty: true, zdjecia: true,
              raporty: true, oferty: true, zadania: true, dokumenty: true, usterki: true
            };
            currentAgreementPerms = {
              inwestor: true,
              budowa: true,
              rada: true,
            };
            await setDoc(
              userDocRef,
              {
                email: currentUser.email,
                role: currentRole,
                permissions: currentPerms,
                editPermissions: currentEditPerms,
                agreementPermissions: currentAgreementPerms,
                assignedProjects,
                approved,
              },
              { merge: true }
            );
          }

          if (currentPerms.dokumenty === undefined) currentPerms.dokumenty = true;
          if (currentPerms.usterki === undefined) currentPerms.usterki = true;
          if (currentEditPerms.dokumenty === undefined) currentEditPerms.dokumenty = true;
          if (currentEditPerms.usterki === undefined) currentEditPerms.usterki = true;

          setUserData({
            role: currentRole,
            displayName: data.displayName || "",
            permissions: currentPerms,
            editPermissions: currentEditPerms,
            agreementPermissions: currentAgreementPerms,
            contractorScope,
            assignedProjects,
            approved,
          });
        } else {
          const defaultRole = isAdminEmail ? "administrator" : "wykonawca";
          const defaultApproved = isAdminEmail ? true : false;

          const defaultPerms = isAdminEmail
            ? { poranna: true, info: true, dziennik: true, ustalenia: true, harmonogram: true, finanse: true, checklisty: true, zdjecia: true, raporty: true, oferty: true, zadania: true, dokumenty: true, usterki: true }
            : { poranna: false, info: false, dziennik: false, ustalenia: false, harmonogram: false, finanse: false, checklisty: false, zdjecia: false, raporty: false, oferty: false, zadania: true, dokumenty: true, usterki: true };

          const defaultEditPerms = isAdminEmail
            ? { poranna: true, info: true, dziennik: true, ustalenia: true, harmonogram: true, finanse: true, checklisty: true, zdjecia: true, raporty: true, oferty: true, zadania: true, dokumenty: true, usterki: true }
            : { poranna: false, info: false, dziennik: false, ustalenia: false, harmonogram: false, finanse: false, checklisty: false, zdjecia: false, raporty: false, oferty: false, zadania: false, dokumenty: false, usterki: false };

          const defaultAgreementPerms = {
            inwestor: true,
            budowa: true,
            rada: true,
          };

          const initialData = {
            email: currentUser.email,
            displayName: "",
            role: defaultRole,
            permissions: defaultPerms,
            editPermissions: defaultEditPerms,
            agreementPermissions: defaultAgreementPerms,
            contractorScope: "",
            assignedProjects: [],
            approved: defaultApproved,
            color: "bg-slate-500",
          };
          await setDoc(userDocRef, initialData);
          setUserData(initialData);
        }
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const baseRef = (col) =>
      collection(db, "artifacts", appId, "public", "data", col);

    const initAndListenProjects = async () => {
      const projectsRef = baseRef("ins_projects");
      const snap = await getDocs(projectsRef);

      if (snap.empty) {
        const p1 = await addDoc(projectsRef, {
          name: "Przykładowa Budowa",
          createdAt: Date.now(),
        });
        await setDoc(
          doc(db, "artifacts", appId, "public", "data", "ins_budgets", p1.id),
          { projectId: p1.id, totalBudget: 500000 }
        );
      }

      return onSnapshot(
        projectsRef,
        (snapshot) => {
          const data = snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => a.createdAt - b.createdAt);
          setProjects(data);
          if (data.length > 0) {
            setActiveProjectId((prev) =>
              prev
                ? data.find((p) => p.id === prev)
                  ? prev
                  : data[0].id
                : data[0].id
            );
          } else {
            setActiveProjectId(null);
          }
        },
        console.error
      );
    };

    let unsubProjects = () => {};
    initAndListenProjects().then((u) => {
      if (u) unsubProjects = u;
    });

    const unsubLogs = onSnapshot(baseRef("ins_logs"), (s) => setLogs(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.timestamp - a.timestamp)), console.error);
    const unsubChecklists = onSnapshot(baseRef("ins_checklists"), (s) => { const c = {}; s.docs.forEach((d) => { c[d.id] = d.data().items || {}; }); setChecklists(c); }, console.error);
    const unsubPhotos = onSnapshot(baseRef("ins_photos"), (s) => setPhotos(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.timestamp - a.timestamp)), console.error);
    const unsubAgreements = onSnapshot(baseRef("ins_agreements"), (s) => setAgreements(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.timestamp - a.timestamp)), console.error);
    const unsubTasks = onSnapshot(baseRef("ins_tasks"), (s) => setTasks(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(a.date) - new Date(b.date))), console.error);
    const unsubCosts = onSnapshot(baseRef("ins_costs"), (s) => setCosts(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.date) - new Date(a.date))), console.error);
    const unsubBudgets = onSnapshot(baseRef("ins_budgets"), (s) => { const b = {}; s.docs.forEach((d) => { b[d.id] = d.data().totalBudget; }); setBudgets(b); }, console.error);
    const unsubCustomTemplates = onSnapshot(baseRef("ins_custom_templates"), (s) => { const t = {}; s.docs.forEach((d) => { t[d.id] = d.data().stages; }); setCustomTemplates(t); }, console.error);
    const unsubUsers = onSnapshot(baseRef("users_roles"), (s) => setUsersList(s.docs.map((d) => ({ id: d.id, ...d.data() }))), console.error);
    const unsubOffers = onSnapshot(baseRef("ins_offers"), (s) => setOffers(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.timestamp - a.timestamp)), console.error);
    const unsubDelegations = onSnapshot(baseRef("ins_delegations"), (s) => setDelegations(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.timestamp - a.timestamp)), console.error);
    const unsubInstallments = onSnapshot(baseRef("ins_installments"), (s) => setInstallments(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => a.timestamp - b.timestamp)), console.error);
    const unsubDocuments = onSnapshot(baseRef("ins_documents"), (s) => setDocuments(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.timestamp - a.timestamp)), console.error);
    const unsubIssues = onSnapshot(baseRef("ins_issues"), (s) => setIssues(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.timestamp - a.timestamp)), console.error);

    return () => {
      unsubProjects();
      unsubLogs();
      unsubChecklists();
      unsubPhotos();
      unsubAgreements();
      unsubTasks();
      unsubCosts();
      unsubBudgets();
      unsubCustomTemplates();
      unsubUsers();
      unsubOffers();
      unsubDelegations();
      unsubInstallments();
      unsubDocuments();
      unsubIssues();
    };
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    try {
      if (!auth) {
        setAuthError("Błąd: Brak inicjalizacji autoryzacji.");
        return;
      }
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      }
    } catch (err) {
      setAuthError("Błąd logowania: " + err.message);
    }
  };

  const handleToggleApproval = async (targetUid, currentApproved) => {
    await updateDoc(
      doc(db, "artifacts", appId, "public", "data", "users_roles", targetUid),
      { approved: !currentApproved }
    );
  };

  const handleUpdateDisplayName = async (targetUid, newName) => {
    await updateDoc(
      doc(db, "artifacts", appId, "public", "data", "users_roles", targetUid),
      { displayName: newName }
    );
  };

  const getShortUserName = (email) => {
    if (!email) return "";
    const u = usersList.find((usr) => usr.email === email);
    return u?.displayName ? u.displayName : email;
  };

  const handleRoleChangeForUser = async (targetUid, newRole) => {
    let newPerms = {};
    let newEditPerms = {};
    let newAgreementPerms = { inwestor: true, budowa: true, rada: true };
    if (
      newRole === "administrator" ||
      newRole === "zarząd" ||
      newRole === "kierownik budowy" ||
      newRole === "inspektor"
    ) {
      newPerms = { poranna: true, info: true, dziennik: true, ustalenia: true, harmonogram: true, finanse: true, checklisty: true, zdjecia: true, raporty: true, oferty: true, zadania: true, dokumenty: true, usterki: true };
      newEditPerms = { poranna: true, info: true, dziennik: true, ustalenia: true, harmonogram: true, finanse: true, checklisty: true, zdjecia: true, raporty: true, oferty: true, zadania: true, dokumenty: true, usterki: true };
    } else if (newRole === "pracownik") {
      newPerms = { poranna: false, info: false, dziennik: false, ustalenia: false, harmonogram: false, finanse: false, checklisty: false, zdjecia: false, raporty: false, oferty: false, zadania: true, dokumenty: true, usterki: true };
      newEditPerms = { poranna: false, info: false, dziennik: false, ustalenia: false, harmonogram: false, finanse: false, checklisty: false, zdjecia: false, raporty: false, oferty: false, zadania: false, dokumenty: false, usterki: false };
    } else if (
      newRole === "inwestor" ||
      newRole === "przedstawiciel inwestora"
    ) {
      newPerms = { poranna: false, info: true, dziennik: true, ustalenia: true, harmonogram: true, finanse: false, checklisty: false, zdjecia: true, raporty: false, oferty: true, zadania: false, dokumenty: true, usterki: false };
      newEditPerms = { poranna: false, info: false, dziennik: false, ustalenia: false, harmonogram: false, finanse: false, checklisty: false, zdjecia: false, raporty: false, oferty: false, zadania: false, dokumenty: false, usterki: false };
      newAgreementPerms = { inwestor: true, budowa: false, rada: true };
    } else {
      newPerms = { poranna: false, info: false, dziennik: true, ustalenia: true, harmonogram: true, finanse: false, checklisty: false, zdjecia: true, raporty: false, oferty: true, zadania: true, dokumenty: true, usterki: true };
      newEditPerms = { poranna: false, info: false, dziennik: true, ustalenia: true, harmonogram: false, finanse: false, checklisty: false, zdjecia: true, raporty: false, oferty: false, zadania: true, dokumenty: false, usterki: true };
      newAgreementPerms = { inwestor: false, budowa: true, rada: true };
    }
    await updateDoc(
      doc(db, "artifacts", appId, "public", "data", "users_roles", targetUid),
      {
        role: newRole,
        permissions: newPerms,
        editPermissions: newEditPerms,
        agreementPermissions: newAgreementPerms,
      }
    );
  };

  const handleTogglePermission = async (targetUid, currentPerms, tabKey) => {
    const updated = { ...currentPerms, [tabKey]: !currentPerms[tabKey] };
    await updateDoc(
      doc(db, "artifacts", appId, "public", "data", "users_roles", targetUid),
      { permissions: updated }
    );
  };

  const handleToggleEditPermission = async (
    targetUid,
    currentEditPerms,
    tabKey
  ) => {
    const updated = {
      ...currentEditPerms,
      [tabKey]: !currentEditPerms[tabKey],
    };
    await updateDoc(
      doc(db, "artifacts", appId, "public", "data", "users_roles", targetUid),
      { editPermissions: updated }
    );
  };

  const handleToggleAgreementPermission = async (
    targetUid,
    currentAgrPerms,
    agrKey
  ) => {
    const updated = { ...currentAgrPerms, [agrKey]: !currentAgrPerms[agrKey] };
    await updateDoc(
      doc(db, "artifacts", appId, "public", "data", "users_roles", targetUid),
      { agreementPermissions: updated }
    );
  };

  const handleUserColorChange = async (targetUid, color) => {
    await updateDoc(
      doc(db, "artifacts", appId, "public", "data", "users_roles", targetUid),
      { color: color }
    );
  };

  const handleSaveContractorScope = async (targetUid, scopeText) => {
    await updateDoc(
      doc(db, "artifacts", appId, "public", "data", "users_roles", targetUid),
      { contractorScope: scopeText }
    );
  };

  const handleToggleProjectAssignment = async (
    targetUid,
    currentAssigned,
    projectId
  ) => {
    let updated = currentAssigned.includes(projectId)
      ? currentAssigned.filter((id) => id !== projectId)
      : [...currentAssigned, projectId];
    await updateDoc(
      doc(db, "artifacts", appId, "public", "data", "users_roles", targetUid),
      { assignedProjects: updated }
    );
  };

  const genericAdd = async (col, data, cb) => {
    if (!user || !activeProjectId || !db) return;
    try {
      await addDoc(collection(db, "artifacts", appId, "public", "data", col), {
        projectId: activeProjectId,
        timestamp: Date.now(),
        ...data,
      });
      if (cb) cb();
    } catch (e) {
      console.error(e);
    }
  };

  const genericDel = async (col, id) => {
    if (user && db) {
      try {
        await deleteDoc(doc(db, "artifacts", appId, "public", "data", col, id));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const genericUpdate = async (col, id, data) => {
    if (!user || !db) return;
    try {
      await updateDoc(
        doc(db, "artifacts", appId, "public", "data", col, id),
        data
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProject = async () => {
    if (!newProjectName.trim() || !user) return;
    try {
      if (editingProject) {
        const pRef = doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "ins_projects",
          editingProject
        );
        await updateDoc(pRef, {
          name: newProjectName,
          investor: newProjectInvestor,
          location: newProjectLocation,
          phone: newProjectPhone,
          description: newProjectDesc,
          mapUrl: newProjectMapUrl,
        });
        if (newProjectBudget !== "")
          await setDoc(
            doc(
              db,
              "artifacts",
              appId,
              "public",
              "data",
              "ins_budgets",
              editingProject
            ),
            {
              projectId: editingProject,
              totalBudget: parseFloat(newProjectBudget) || 0,
            }
          );
      } else {
        const pRef = await addDoc(
          collection(db, "artifacts", appId, "public", "data", "ins_projects"),
          {
            name: newProjectName,
            investor: newProjectInvestor,
            location: newProjectLocation,
            phone: newProjectPhone,
            description: newProjectDesc,
            mapUrl: newProjectMapUrl,
            createdAt: Date.now(),
          }
        );
        if (newProjectBudget !== "")
          await setDoc(
            doc(
              db,
              "artifacts",
              appId,
              "public",
              "data",
              "ins_budgets",
              pRef.id
            ),
            { projectId: pRef.id, totalBudget: parseFloat(newProjectBudget) || 0 }
          );
      }
      resetProjectForm();
    } catch (e) {
      console.error(e);
    }
  };

  const resetProjectForm = () => {
    setNewProjectName("");
    setNewProjectInvestor("");
    setNewProjectLocation("");
    setNewProjectPhone("");
    setNewProjectDesc("");
    setNewProjectMapUrl("");
    setNewProjectBudget("");
    setEditingProject(null);
    setIsProjectModalOpen(false);
  };

  const openEditModal = (p) => {
    setNewProjectName(p.name || "");
    setNewProjectInvestor(p.investor || "");
    setNewProjectLocation(p.location || "");
    setNewProjectPhone(p.phone || "");
    setNewProjectDesc(p.description || "");
    setNewProjectMapUrl(p.mapUrl || "");
    setNewProjectBudget(budgets[p.id] || "");
    setEditingProject(p.id);
    setIsProjectModalOpen(true);
  };

  const executeDeleteProject = async () => {
    if (projectToDelete && user && db) {
      try {
        await deleteDoc(
          doc(
            db,
            "artifacts",
            appId,
            "public",
            "data",
            "ins_projects",
            projectToDelete
          )
        );
        setProjectToDelete(null);
      } catch (err) {
        console.error("Błąd usuwania budowy:", err);
      }
    }
  };

  const executeDeleteUserRecord = async () => {
    if (userToDelete && user && db) {
      try {
        await deleteDoc(
          doc(
            db,
            "artifacts",
            appId,
            "public",
            "data",
            "users_roles",
            userToDelete
          )
        );
        setUserToDelete(null);
      } catch (err) {
        console.error("Błąd usuwania usera:", err);
      }
    }
  };

  const exportCostsToCSV = () => {
    if (projCosts.length === 0) {
      alert("Brak kosztów do wyeksportowania.");
      return;
    }
    const headers = ["Data", "Kategoria", "Nr Faktury/Dok", "Status", "Opis", "Kwota (PLN)"];
    const rows = projCosts.map(c =>
      `"${c.date}","${c.category}","${c.invoiceNumber || '-'}","${c.isPaid === false ? 'Do zapłaty' : 'Opłacone'}","${(c.description || '').replace(/"/g, '""')}","${c.amount}"`
    );
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Koszty_${(activeProjectData.name || 'Budowa').replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isAdministrator = userData.role === "administrator";
  const isFullAccess = isAdministrator;

  const canViewTab = (tabKey) => {
    if (
      tabKey === "info" &&
      (userData.role === "inwestor" ||
        userData.role === "przedstawiciel inwestora")
    )
      return false;
    if (tabKey === "info" && userData.role === "wykonawca") return false;
    if (tabKey === "poranna") return isAdministrator;
    if (isFullAccess) return true;
    return !!(userData.permissions && userData.permissions[tabKey]);
  };

  const canEditTab = (tabKey) =>
    isFullAccess ||
    !!(userData.editPermissions && userData.editPermissions[tabKey]);

  const canViewAgreementType = (typeKey) => {
    if (isAdministrator) return true;
    if (typeKey === "rada") return true;
    return userData.agreementPermissions
      ? !!userData.agreementPermissions[typeKey]
      : true;
  };

  const getUserColor = (email) => {
    const u = usersList.find((u) => u.email === email);
    return u?.color || "bg-slate-500";
  };

  const toggleVisibleUser = (email) => {
    if (visibleUsersInCalendar.includes(email)) {
      setVisibleUsersInCalendar(
        visibleUsersInCalendar.filter((e) => e !== email)
      );
    } else {
      setVisibleUsersInCalendar([...visibleUsersInCalendar, email]);
    }
  };

  const availableProjects = isAdministrator
    ? projects
    : projects.filter((p) => (userData.assignedProjects || []).includes(p.id));

  const activeProjectData =
    projects.find((p) => p.id === activeProjectId) || {};
  const projCosts = costs.filter((c) => c.projectId === activeProjectId);
  const currentTotalCosts = projCosts.reduce((a, b) => a + (b.amount || 0), 0);
  const unpaidCostsTotal = projCosts
    .filter((c) => c.isPaid === false)
    .reduce((a, b) => a + (b.amount || 0), 0);
  const currentBudget = budgets[activeProjectId] || 0;

  const projInstallments = installments.filter(
    (i) => i.projectId === activeProjectId
  );
  const totalPaid = projInstallments
    .filter((i) => i.isPaid)
    .reduce((sum, i) => sum + (i.amount || 0), 0);
  const remainingToSettle = currentBudget - totalPaid;
  const currentProfit = totalPaid - currentTotalCosts;

  const currentChecklistTemplate =
    customTemplates[activeProjectId] || DEFAULT_CHECKLISTS;
  const currentCState = checklists[activeProjectId] || {};

  const getProjectProgress = (projId) => {
    const tmpl = customTemplates[projId] || DEFAULT_CHECKLISTS;
    const st = checklists[projId] || {};
    let tot = 0;
    let comp = 0;
    Object.entries(tmpl).forEach(([stage, items]) => {
      tot += (items || []).length;
      (items || []).forEach((_, i) => {
        if (st[`${stage}_${i}`]) comp++;
      });
    });
    return tot > 0 ? Math.round((comp / tot) * 100) : 0;
  };

  const saveChecklistTemplate = async (newObj) => {
    if (!user || !activeProjectId) return;
    try {
      await setDoc(
        doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "ins_custom_templates",
          activeProjectId
        ),
        { stages: newObj }
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleRenameStage = (oldName) => {
    if (!newStageNameInput.trim() || oldName === newStageNameInput) {
      setEditingStageName(null);
      return;
    }
    const updated = {};
    Object.entries(currentChecklistTemplate).forEach(([stName, items]) => {
      if (stName === oldName) {
        updated[newStageNameInput.trim()] = items;
      } else {
        updated[stName] = items;
      }
    });
    saveChecklistTemplate(updated);
    setEditingStageName(null);
    setNewStageNameInput("");
  };

  const handleAddCategory = () => {
    if (!newCategoryTitleInput.trim()) return;
    const updated = {
      ...currentChecklistTemplate,
      [newCategoryTitleInput.trim()]: [],
    };
    saveChecklistTemplate(updated);
    setNewCategoryTitleInput("");
  };

  let totalChecklistItems = 0;
  let completedChecklistItems = 0;
  Object.entries(currentChecklistTemplate).forEach(([stage, items]) => {
    totalChecklistItems += (items || []).length;
    (items || []).forEach((_, i) => {
      if (currentCState[`${stage}_${i}`]) completedChecklistItems++;
    });
  });
  const globalProgress =
    totalChecklistItems > 0
      ? Math.round((completedChecklistItems / totalChecklistItems) * 100)
      : 0;

  const projTasks = tasks.filter((t) => t.projectId === activeProjectId);
  const projOffers = offers.filter((o) => o.projectId === activeProjectId);
  const projAgreements = agreements.filter(
    (a) => a.projectId === activeProjectId
  );
  const projDelegations = delegations.filter(
    (d) => d.projectId === activeProjectId
  );
  const projDocuments = documents.filter(
    (d) => d.projectId === activeProjectId
  );
  const projIssues = issues.filter(
    (i) => i.projectId === activeProjectId
  );

  const openIssuesCount = projIssues.filter(
    (i) => i.status !== "Zaakceptowana" && i.status !== "Naprawiona"
  ).length;

  const pendingDelegationsCount = projDelegations.filter(
    (d) => d.status !== "Zatwierdzone"
  ).length;

  const combinedCalendarItems = [
    ...projTasks.map((t) => ({
      id: t.id,
      type: "task",
      title: t.task,
      date: t.date,
      color: "bg-slate-700",
      assignee: null,
      raw: t,
    })),
    ...projDelegations
      .filter((d) => d.deadline)
      .map((d) => ({
        id: d.id,
        type: "delegation",
        title: d.title,
        date: d.deadline,
        color: getUserColor(d.assignee),
        assignee: d.assignee,
        raw: d,
      })),
  ];

  const todayStr = formatDateStr(new Date());
  const todayTasks = combinedCalendarItems.filter((t) => t.date === todayStr);

  const getWeekRange = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { monday, sunday };
  };
  const { monday, sunday } = getWeekRange();
  const weekTasks = combinedCalendarItems.filter((t) => {
    const tDate = new Date(t.date);
    return tDate >= monday && tDate <= sunday;
  });

  const getDaysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };
  const getWeekDays = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(
        new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
      );
    }
    return week;
  };

  const moveDate = (amount, unit) => {
    const d = new Date(currentCalDate);
    if (unit === "month") d.setMonth(d.getMonth() + amount);
    if (unit === "week") d.setDate(d.getDate() + amount * 7);
    if (unit === "day") d.setDate(d.getDate() + amount);
    setCurrentCalDate(d);
  };

  const generateReportDates = () => {
    let dFrom = new Date(),
      dTo = new Date();
    if (reportPeriod === "tydzien") {
      const day = dFrom.getDay() || 7;
      dFrom.setDate(dFrom.getDate() - day + 1);
    } else if (reportPeriod === "miesiac") {
      dFrom = new Date(dFrom.getFullYear(), dFrom.getMonth(), 1);
    } else if (reportPeriod === "kwartal") {
      const q = Math.floor(dFrom.getMonth() / 3);
      dFrom = new Date(dFrom.getFullYear(), q * 3, 1);
    } else if (reportPeriod === "rok") {
      dFrom = new Date(dFrom.getFullYear(), 0, 1);
    } else if (reportPeriod === "custom") {
      return {
        f: new Date(reportDateFrom || Date.now()),
        t: new Date(reportDateTo || Date.now()),
      };
    }

    dTo = new Date();
    dTo.setFullYear(dTo.getFullYear() + 5);
    return { f: dFrom, t: dTo };
  };

  const getFilteredReportData = () => {
    const { f, t } = generateReportDates();
    f.setHours(0, 0, 0, 0);
    t.setHours(23, 59, 59, 999);
    const filterByDate = (dateStr) => {
      let d = parseLocal(dateStr);
      return d >= f && d <= t;
    };

    return {
      periodStr: `${formatDateStr(f)} do ${formatDateStr(t)}`,
      repCosts: projCosts.filter((c) => filterByDate(c.date)),
      repLogs: logs.filter(
        (l) => l.projectId === activeProjectId && filterByDate(l.dateString)
      ),
      repAgreementsInwestor: canViewAgreementType("inwestor")
        ? projAgreements.filter(
            (a) => a.type === "inwestor" && filterByDate(a.dateString)
          )
        : [],
      repAgreementsBudowa: canViewAgreementType("budowa")
        ? projAgreements.filter(
            (a) => a.type === "budowa" && filterByDate(a.dateString)
          )
        : [],
      repAgreementsRada: canViewAgreementType("rada")
        ? projAgreements.filter(
            (a) => a.type === "rada" && filterByDate(a.dateString)
          )
        : [],
      repPhotos: photos.filter(
        (p) => p.projectId === activeProjectId && filterByDate(p.dateString)
      ),
      repIssues: projIssues,
    };
  };

  // --- LOGIKA DO ZBIORCZEGO PANELU ADMINISTRATORA ---
  const globalTasks = [];
  const globalIssues = [];
  
  if (isAdministrator && currentScreen === "home") {
    const safeDate = (ds) => { try { return new Date(ds); } catch { return new Date(); } };
    
    tasks.forEach(t => {
      if(t.date) {
        const pName = projects.find(p => p.id === t.projectId)?.name || 'Nieznana budowa';
        globalTasks.push({ id: t.id, title: t.task, dateStr: t.date, dateObj: safeDate(t.date), projName: pName, type: 'Ogólne', assignee: null, status: 'Zaplanowane', projectId: t.projectId });
      }
    });

    delegations.forEach(d => {
      if(d.deadline && d.status !== 'Zatwierdzone') {
        const pName = projects.find(p => p.id === d.projectId)?.name || 'Nieznana budowa';
        globalTasks.push({ id: d.id, title: d.title, dateStr: d.deadline, dateObj: safeDate(d.deadline), projName: pName, type: 'Delegowane', assignee: d.assignee, status: d.status, projectId: d.projectId });
      }
    });
    
    issues.forEach(iss => {
      if(iss.status !== 'Naprawiona' && iss.status !== 'Zaakceptowana') {
        const pName = projects.find(p => p.id === iss.projectId)?.name || 'Nieznana budowa';
        globalIssues.push({ id: iss.id, title: iss.title, dateStr: iss.dateString, projName: pName, status: iss.status, priority: iss.priority || "Normalny", assignee: iss.assignee, projectId: iss.projectId });
      }
    });

    globalTasks.sort((a, b) => a.dateObj - b.dateObj);
  }
  
  const overdueGlobalTasks = globalTasks.filter(t => t.dateStr < todayStr);
  const upcomingGlobalTasks = globalTasks.filter(t => t.dateStr >= todayStr).slice(0, 15);

  if (isAuthLoading)
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
      </div>
    );

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 font-sans">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 border border-slate-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <HardHat className="w-9 h-9 text-amber-500" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Nadzór Budowlany PRO
            </h1>
            <p className="text-[11px] font-semibold text-slate-400 mt-1 uppercase tracking-widest">
              System Zarządzania i Kontroli Inwestycji
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Adres E-mail
              </label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 text-sm mt-1 focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition"
                placeholder="inwestycja@firma.pl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Hasło
              </label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 text-sm mt-1 focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition"
                placeholder="••••••••"
              />
            </div>
            {authError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl font-medium">
                {
