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
  Zap,
  Maximize2,
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
// INICJALIZACJA FIREBASE (100% ZACHOWANA STRUKTURA BAZY DANYCH)
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
    "Podpisana umowa z wycenionym zakresem robót i załącznikami",
    "Protokół przekazania placu / frontu robót",
    "Oświadczenie BHP oraz plan BIOZ podpisany przez kierownika/brygadzistę",
    "Dostarczone certyfikaty, aprobaty i deklaracje właściwości użytkowych (DWU)",
    "Harmonogram rzeczowo-finansowy i harmonogram dostaw materiałów",
  ],
  "Stan Zero": [
    "Przejęcie tyczenia osi budynku od uprawnionego geodety (wpis do DB)",
    "Ocena gruntu rodzimego i dna wykopu przed ułożeniem chudego betonu",
    "Odbiór zbrojenia ław/płyty: średnice, strzemiona, zakłady, otuliny dystansowe",
    "Weryfikacja rzędnych posadowienia, bednarki uziemiającej i przepustów instalacyjnych",
    "Izolacje przeciwwilgociowe i termiczne fundamentów: ciągłość, grubość, zgrzewy",
    "Odbiór drenażu opaskowego ze studzienkami rewizyjnymi i zasypki z zagęszczeniem",
  ],
  "Stan Surowy Otwarty (SSO)": [
    "Weryfikacja izolacji poziomej, pionów ścian, wiązania murarskiego i kątów",
    "Odbiór zbrojenia nadproży, słupów, trzpieni i podciągów przed zabetonowaniem",
    "Strop, schody i wieńce: deskowanie, układ zbrojenia, podparcie, pielęgnacja betonu",
    "Kontrola wymiarów otworów okiennych i drzwiowych względem projektu (światło muru)",
    "Drożność, pionowość i wyczystki przewodów kominowych oraz wentylacyjnych",
    "Więźba dachowa: przekroje drewna, wilgotność, impregnacja, kotwienie murłat, oparcie",
  ],
  "Stan Surowy Zamknięty (SSZ)": [
    "Montaż stolarki okiennej (weryfikacja podwalin, kotwienia i szczelności taśm - ciepły montaż)",
    "Montaż bramy garażowej i drzwi zewnętrznych tymczasowych/docelowych",
    "Zamknięcie dachu: membrana, łacenie, kontrłaty, pokrycie, obróbki blacharskie i kominy",
    "Uporządkowanie placu budowy po pracach stanu surowego",
  ],
  "Instalacje Wewnętrzne": [
    "Weryfikacja tras prowadzenia instalacji (brak podcinania elementów konstrukcyjnych)",
    "Próba ciśnieniowa instalacji wodnej oraz C.O. (protokół szczelności)",
    "Ogrzewanie podłogowe: ułożenie styropianu, taśmy brzegowe, rozstaw pętli, dylatacje",
    "Test drożności oraz weryfikacja spadków kanalizacji sanitarnej",
    "Pomiary rezystancji izolacji kabli, dokumentacja fotograficzna tras przed tynkowaniem",
  ],
  "Tynki i Wylewki": [
    "Weryfikacja przygotowania podłoża pod tynki (gruntowanie, siatki na łączeniach materiałów, listwy)",
    "Odbiór płaszczyzn, pionów i kątów prostych (szczególnie w łazienkach i kuchni)",
    "Kontrola grubości, zbrojenia rozproszonego/siatki i poziomu wylewek (dylatacje obwodowe i progowe)",
    "Pomiary wilgotności posadzek metodą CM po wygrzaniu przed montażem podłóg",
  ],
  "Stan Deweloperski": [
    "Zakończenie prac elewacyjnych (kołkowanie, warstwa zbrojona, tynk, obróbki parapetów)",
    "Montaż osprzętu elektrycznego (rozdzielnica z opisem, gniazda, włączniki)",
    "Montaż i pierwsze uruchomienie źródła ciepła (kocioł/pompa ciepła) z protokołem",
    "Próby szczelności gazu/rekuperacji i protokoły odbiorowe instalacji końcowych",
    "Niwelacja terenu, podbudowy pod kostkę i uporządkowanie terenu zewnętrznego",
  ],
  "Prace Wykończeniowe (Pod klucz)": [
    "Weryfikacja gładzi w świetle bocznym oraz malowania ścian i sufitów",
    "Montaż okładzin podłogowych, dylatacji, listew przypodłogowych i ościeżnic drzwiowych",
    "Biały montaż sanitarny (szczelność syfonów, silikonowanie, hydroizolacje podPłytkowe)",
    "Montaż opraw oświetleniowych i osprzętu sterującego",
    "Odbiór zabudów stolarskich / kuchni (poziomy, domyki, podłączenia AGD)",
  ],
  "Odbiory Końcowe": [
    "Przyłącze wod-kan (protokół odbioru z wodociągów, inwentaryzacja geodezyjna)",
    "Przyłącze energetyczne i komplet pięcioletnich pomiarów elektrycznych",
    "Protokół kominiarski (drożność i ciągi wentylacyjno-spalinowe)",
    "Kompletny Dziennik Budowy i Oświadczenie Kierownika Budowy o zakończeniu prac",
    "Złożenie zawiadomienia o zakończeniu budowy do PINB / Pozwolenie na użytkowanie",
  ],
};

const QUICK_LOG_TEMPLATES = [
  "Odbiór robót zanikających i ulegających zakryciu – bez uwag. Zezwalam na kontynuację prac.",
  "Kontrola zbrojenia (średnice, rozstaw strzemion, zakłady, dystanse). Zgodne z PW. Zezwalam na betonowanie.",
  "Przeprowadzono próbę ciśnieniową instalacji wod-kan / C.O. Ciśnienie próbne utrzymane, brak wycieków.",
  "Wizytacja nadzoru inwestorskiego. Zweryfikowano postęp prac oraz przestrzeganie przepisów BHP.",
  "Stwierdzono niezgodność z projektem technicznym. Nakazano wstrzymanie prac na tym odcinku i wykonanie poprawek.",
];

const WEATHER_OPTIONS = [
  { id: "slonce", label: "Słonecznie", icon: "☀️" },
  { id: "chmury", label: "Pochmurno", icon: "⛅" },
  { id: "deszcz", label: "Opady deszczu", icon: "🌧️" },
  { id: "mroz", label: "Mróz / Śnieg", icon: "❄️" },
  { id: "wiatr", label: "Silny wiatr", icon: "💨" },
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
        const MAX = 900;
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
  if (file.size > 750000) {
    alert("Plik jest zbyt duży! Maksymalny rozmiar dokumentu w bazie to ok. 750 KB.");
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
  const [editingOfferId, setEditingOfferId] = useState(null);
  const [editOfferSupplier, setEditOfferSupplier] = useState("");
  const [editOfferDesc, setEditOfferDesc] = useState("");
  const [editOfferCostPrice, setEditOfferCostPrice] = useState("");
  const [editOfferInvestorPrice, setEditOfferInvestorPrice] = useState("");
  const [editOfferStatus, setEditOfferStatus] = useState("");

  const [editingInstId, setEditingInstId] = useState(null);
  const [editInstTitle, setEditInstTitle] = useState("");
  const [editInstAmount, setEditInstAmount] = useState("");

  // Dziennik Budowy - rozszerzone pola inżynierskie
  const [newLogText, setNewLogText] = useState("");
  const [newLogCustomDate, setNewLogCustomDate] = useState("");
  const [newLogPhotoBase64, setNewLogPhotoBase64] = useState(null);
  const [newLogWeather, setNewLogWeather] = useState("slonce");
  const [newLogTemp, setNewLogTemp] = useState("");
  const [newLogWorkers, setNewLogWorkers] = useState("");
  const [logSearchQuery, setLogSearchQuery] = useState("");

  const [agreementType, setAgreementType] = useState("inwestor");
  const [newAgreementText, setNewAgreementText] = useState("");
  const [newAgreementDate, setNewAgreementDate] = useState("");

  const [newTaskDate, setNewTaskDate] = useState("");
  const [newTaskText, setNewTaskText] = useState("");

  const [newCostDate, setNewCostDate] = useState("");
  const [newCostAmount, setNewCostAmount] = useState("");
  const [newCostDesc, setNewCostDesc] = useState("");
  const [newCostCategory, setNewCostCategory] = useState("Materiały");

  const [newInstTitle, setNewInstTitle] = useState("");
  const [newInstAmount, setNewInstAmount] = useState("");

  const [newOfferSupplier, setNewOfferSupplier] = useState("");
  const [newOfferDesc, setNewOfferDesc] = useState("");
  const [newOfferCostPrice, setNewOfferCostPrice] = useState("");
  const [newOfferInvestorPrice, setNewOfferInvestorPrice] = useState("");
  const [newOfferStatus, setNewOfferStatus] = useState("Oczekuje");

  // Zadania Delegowane + czysty stan React dla notatek zamiast document.getElementById
  const [newDelegationTitle, setNewDelegationTitle] = useState("");
  const [newDelegationDesc, setNewDelegationDesc] = useState("");
  const [newDelegationAssignee, setNewDelegationAssignee] = useState("");
  const [newDelegationDeadline, setNewDelegationDeadline] = useState("");
  const [delegationNotesDraft, setDelegationNotesDraft] = useState({});

  // Dokumenty
  const [newDocName, setNewDocName] = useState("");
  const [newDocCategory, setNewDocCategory] = useState("Projekt / Rysunek");
  const [isDocUploading, setIsDocUploading] = useState(false);
  const docInputRef = useRef(null);

  // Usterki (Punch-list) - rozszerzone o priorytet i lokalizację
  const [newIssueTitle, setNewIssueTitle] = useState("");
  const [newIssueDesc, setNewIssueDesc] = useState("");
  const [newIssueAssignee, setNewIssueAssignee] = useState("");
  const [newIssuePriority, setNewIssuePriority] = useState("Ważna");
  const [newIssueLocation, setNewIssueLocation] = useState("");
  const [newIssuePhoto, setNewIssuePhoto] = useState(null);
  const [issueFilter, setIssueFilter] = useState("otwarte");
  const issuePhotoRef = useRef(null);
  const [editingIssueId, setEditingIssueId] = useState(null);
  const [editIssueStatus, setEditIssueStatus] = useState("");
  const [editIssueNote, setEditIssueNote] = useState("");

  // Lightbox do podglądu zdjęć w pełnej rozdzielczości
  const [lightboxImage, setLightboxImage] = useState(null);

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
        authorEmail: user.email,
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
        if (newProjectBudget)
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
              totalBudget: parseFloat(newProjectBudget),
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
        if (newProjectBudget)
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
            { projectId: pRef.id, totalBudget: parseFloat(newProjectBudget) }
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
    const headers = ["Data", "Kategoria", "Opis", "Kwota (PLN)"];
    const rows = projCosts.map(
      (c) => `"${c.date}","${c.category}","${c.description || ""}","${c.amount}"`
    );
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Koszty_${(activeProjectData.name || "Budowa").replace(/\s+/g, "_")}.csv`
    );
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

  const getProjectProgress = (projId) => {
    const tmpl = customTemplates[projId] || DEFAULT_CHECKLISTS;
    const state = checklists[projId] || {};
    let total = 0;
    let done = 0;
    Object.entries(tmpl).forEach(([stage, items]) => {
      total += (items || []).length;
      (items || []).forEach((_, i) => {
        if (state[`${stage}_${i}`]) done++;
      });
    });
    return total > 0 ? Math.round((done / total) * 100) : 0;
  };

  const availableProjects = isAdministrator
    ? projects
    : projects.filter((p) => (userData.assignedProjects || []).includes(p.id));

  const activeProjectData =
    projects.find((p) => p.id === activeProjectId) || {};
  const projCosts = costs.filter((c) => c.projectId === activeProjectId);
  const currentTotalCosts = projCosts.reduce((a, b) => a + (b.amount || 0), 0);
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
  const projIssues = issues.filter((i) => i.projectId === activeProjectId);
  const activeProjIssuesCount = projIssues.filter(
    (i) => i.status !== "Zaakceptowana"
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
  const todayTasks = projTasks.filter((t) => t.date === todayStr);

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
  const weekTasks = projTasks.filter((t) => {
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
      repIssues: projIssues.filter((i) => filterByDate(i.dateString)),
    };
  };

  // --- LOGIKA DO ZBIORCZEGO PANELU ADMINISTRATORA ---
  const globalTasks = [];
  const globalIssues = [];

  if (isAdministrator && currentScreen === "home") {
    const safeDate = (ds) => {
      try {
        return new Date(ds);
      } catch {
        return new Date();
      }
    };

    tasks.forEach((t) => {
      if (t.date) {
        const pName =
          projects.find((p) => p.id === t.projectId)?.name || "Nieznana budowa";
        globalTasks.push({
          id: t.id,
          title: t.task,
          dateStr: t.date,
          dateObj: safeDate(t.date),
          projName: pName,
          type: "Ogólne",
          assignee: null,
          status: "Oczekuje",
          projectId: t.projectId,
        });
      }
    });

    delegations.forEach((d) => {
      if (d.deadline && d.status !== "Zatwierdzone") {
        const pName =
          projects.find((p) => p.id === d.projectId)?.name || "Nieznana budowa";
        globalTasks.push({
          id: d.id,
          title: d.title,
          dateStr: d.deadline,
          dateObj: safeDate(d.deadline),
          projName: pName,
          type: "Delegowane",
          assignee: d.assignee,
          status: d.status,
          projectId: d.projectId,
        });
      }
    });

    issues.forEach((iss) => {
      if (iss.status !== "Naprawiona" && iss.status !== "Zaakceptowana") {
        const pName =
          projects.find((p) => p.id === iss.projectId)?.name ||
          "Nieznana budowa";
        globalIssues.push({
          id: iss.id,
          title: iss.title,
          dateStr: iss.dateString,
          projName: pName,
          status: iss.status,
          priority: iss.priority || "Ważna",
          assignee: iss.assignee,
          projectId: iss.projectId,
        });
      }
    });

    globalTasks.sort((a, b) => a.dateObj - b.dateObj);
  }

  const overdueGlobalTasks = globalTasks.filter((t) => t.dateStr < todayStr);
  const upcomingGlobalTasks = globalTasks
    .filter((t) => t.dateStr >= todayStr)
    .slice(0, 15);

  // GLOBALNY MODAL PROJEKTU (Działa na Home i wewnątrz Projektu)
  const renderProjectModal = () => {
    if (!isProjectModalOpen) return null;
    return (
      <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
        <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] shadow-2xl border border-slate-200">
          <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-base tracking-tight">
                {editingProject ? "Edycja Parametrów Budowy" : "Rejestracja Nowej Inwestycji"}
              </h2>
            </div>
            <button
              onClick={() => setIsProjectModalOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Nazwa inwestycji *
              </label>
              <input
                type="text"
                placeholder="np. Budowa domów jednorodzinnych - Kalna"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Inwestor
                </label>
                <input
                  type="text"
                  placeholder="Nazwa firmy / Imię i nazwisko"
                  value={newProjectInvestor}
                  onChange={(e) => setNewProjectInvestor(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Telefon kontaktowy
                </label>
                <input
                  type="tel"
                  placeholder="+48 000 000 000"
                  value={newProjectPhone}
                  onChange={(e) => setNewProjectPhone(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Lokalizacja (adres / działka)
                </label>
                <input
                  type="text"
                  placeholder="Miasto, ulica, nr działki"
                  value={newProjectLocation}
                  onChange={(e) => setNewProjectLocation(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Budżet całkowity (PLN)
                </label>
                <input
                  type="number"
                  placeholder="np. 650000"
                  value={newProjectBudget}
                  onChange={(e) => setNewProjectBudget(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Link do mapy / Pinezka Google Maps (URL)
              </label>
              <input
                type="url"
                value={newProjectMapUrl}
                onChange={(e) => setNewProjectMapUrl(e.target.value)}
                placeholder="https://maps.app.goo.gl/..."
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Charakterystyka techniczna / Opis (PUM, pow., nr pozwolenia)
              </label>
              <textarea
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                placeholder="Podstawowe dane techniczne obiektu, nr decyzji PnB, parametry..."
                className="w-full border border-slate-300 rounded-xl p-3 text-sm min-h-[90px] focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsProjectModalOpen(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-sm font-bold transition"
              >
                Anuluj
              </button>
              <button
                onClick={handleSaveProject}
                disabled={!newProjectName.trim()}
                className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 py-3 rounded-xl text-sm font-bold shadow-md transition"
              >
                {editingProject ? "Zapisz zmiany" : "Utwórz inwestycję"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // LIGHTBOX DO POWIĘKSZANIA ZDJĘĆ
  const renderLightbox = () => {
    if (!lightboxImage) return null;
    return (
      <div
        onClick={() => setLightboxImage(null)}
        className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 animate-in fade-in"
      >
        <button
          onClick={() => setLightboxImage(null)}
          className="absolute top-5 right-5 bg-slate-800 text-white p-2.5 rounded-full hover:bg-slate-700 transition"
        >
          <X className="w-6 h-6" />
        </button>
        <img
          src={lightboxImage.src}
          alt="Powiększenie"
          className="max-h-[80vh] max-w-[95vw] object-contain rounded-xl shadow-2xl border border-slate-800"
          onClick={(e) => e.stopPropagation()}
        />
        {(lightboxImage.caption || lightboxImage.date) && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-4 bg-slate-900/90 border border-slate-800 text-white px-6 py-3 rounded-xl max-w-xl text-center"
          >
            {lightboxImage.date && (
              <p className="text-[11px] text-amber-400 font-mono uppercase font-bold">
                {lightboxImage.date}
              </p>
            )}
            {lightboxImage.caption && (
              <p className="text-sm mt-1">{lightboxImage.caption}</p>
            )}
          </div>
        )}
      </div>
    );
  };

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
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <HardHat className="w-9 h-9 text-amber-500" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              NADZÓR BUDOWLANY
            </h1>
            <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
              System Zarządzania i Kontroli Inwestycji
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-slate-500">
                Adres E-mail
              </label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-3 text-sm mt-1 focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="inzynier@firma.pl"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-500">
                Hasło
              </label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-3 text-sm mt-1 focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="••••••••"
              />
            </div>
            {authError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl font-medium">
                {authError}
              </p>
            )}
            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl text-sm font-bold shadow-lg transition"
            >
              {isRegistering ? "Zarejestruj nowe konto" : "Zaloguj do systemu"}
            </button>
          </form>
          <div className="mt-6 text-center border-t pt-4">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-xs font-bold text-slate-600 hover:text-amber-600 transition"
            >
              {isRegistering
                ? "Masz już konto? Przejdź do logowania"
                : "Nowy podwykonawca / inwestor? Zarejestruj się"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!userData.approved && !isAdministrator) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 p-4 font-sans">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center space-y-4">
          <div className="mx-auto bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center text-amber-600 font-bold text-2xl">
            <Clock className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Weryfikacja Uprawnień
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Konto <strong>{user.email}</strong> zostało utworzone. Oczekuje na
            zatwierdzenie przez Inspektora / Administratora i przypisanie do
            konkretnych projektów budowlanych.
          </p>
          <button
            onClick={() => auth.signOut()}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl text-sm font-bold transition"
          >
            Wyloguj się
          </button>
        </div>
      </div>
    );
  }

  // WIDOK PODGLĄDU RAPORTU PDF / DRUKU A4
  if (showReportPreview) {
    const data = getFilteredReportData();
    const repCostTotal = data.repCosts.reduce((a, b) => a + (b.amount || 0), 0);
    const spentPercent =
      currentBudget > 0
        ? Math.min(100, Math.round((repCostTotal / currentBudget) * 100))
        : 0;

    return (
      <div className="fixed inset-0 z-50 bg-slate-200 overflow-y-auto print:static print:bg-white print:overflow-visible print:h-auto print:w-full print:block">
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @media print {
            @page { size: A4 portrait; margin: 14mm; }
            html, body, #root { 
              height: auto !important; 
              overflow: visible !important; 
              background: white !important; 
            }
            .print\\:hidden { display: none !important; }
            .report-page { 
              box-shadow: none !important; 
              margin: 0 !important; 
              padding: 0 !important; 
            }
            .break-inside-avoid { 
              break-inside: avoid; 
              page-break-inside: avoid; 
            }
          }
        `,
          }}
        />
        <div className="sticky top-0 bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-lg print:hidden z-20">
          <button
            onClick={() => setShowReportPreview(false)}
            className="bg-slate-800 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-700 transition flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Wróć do aplikacji
          </button>
          <button
            onClick={() => window.print()}
            className="bg-amber-500 text-slate-950 px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-amber-400 transition shadow-md"
          >
            Drukuj / Zapisz PDF <Printer className="w-4 h-4" />
          </button>
        </div>

        <div className="max-w-[210mm] mx-auto bg-white min-h-[297mm] my-8 p-12 shadow-2xl print:m-0 print:p-0 print:shadow-none print:w-full font-sans text-slate-800 report-page">
          <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">
                Raport Techniczny z Budowy
              </h1>
              <p className="text-slate-500 mt-2 text-sm">
                Okres sprawozdawczy:{" "}
                <span className="font-bold text-slate-800">
                  {data.periodStr}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-amber-600 uppercase tracking-wider">
                Nadzór Inwestorski / Inwestor Zastępczy
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Sporządził: {userData.displayName || user.email}
              </p>
              <p className="text-xs text-slate-500">
                Data: {new Date().toLocaleDateString("pl-PL")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-10">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs uppercase font-bold text-slate-400 mb-2">
                Dane Inwestycji
              </h3>
              <p className="font-bold text-lg text-slate-900 mb-1">
                {activeProjectData.name}
              </p>
              {activeProjectData.investor && (
                <p className="text-sm">
                  Inwestor: <strong>{activeProjectData.investor}</strong>
                </p>
              )}
              {activeProjectData.location && (
                <p className="text-sm">
                  Lokalizacja: {activeProjectData.location}
                </p>
              )}
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs uppercase font-bold text-slate-400 mb-2">
                Zaawansowanie Odbiorów Technicznych
              </h3>
              <div className="flex items-center justify-between mb-1">
                <span className="text-3xl font-black text-slate-900">
                  {globalProgress}%
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  {completedChecklistItems} / {totalChecklistItems} pkt kontrolnych
                </span>
              </div>
              <div className="bg-slate-200 h-2.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-slate-900 h-2.5 rounded-full"
                  style={{ width: `${globalProgress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {reportConfig.budget && (
            <div className="mb-10 border border-slate-200 rounded-xl p-6 bg-slate-50/50 break-inside-avoid">
              <h3 className="text-sm uppercase font-bold text-slate-800 mb-4 border-b pb-2">
                Zestawienie Finansowe Inwestycji
              </h3>
              <div className="flex items-center gap-8">
                <div
                  className="w-28 h-28 rounded-full border-8 border-slate-100 relative flex items-center justify-center shadow-inner"
                  style={{
                    background: `conic-gradient(#0f172a ${spentPercent}%, #e2e8f0 0)`,
                  }}
                >
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center flex-col">
                    <span className="text-lg font-black">{spentPercent}%</span>
                    <span className="text-[9px] text-slate-400 uppercase font-bold">
                      Budżetu
                    </span>
                  </div>
                </div>
                <div className="flex-1 space-y-2.5 text-sm">
                  <div className="flex justify-between border-b pb-1.5">
                    <span className="text-slate-500">Budżet bazowy:</span>
                    <span className="font-bold">{formatCurrency(currentBudget)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1.5">
                    <span className="text-slate-500">Wpłacone transze:</span>
                    <span className="font-bold text-blue-700">{formatCurrency(totalPaid)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1.5">
                    <span className="text-slate-500">Koszty w okresie raportu:</span>
                    <span className="font-bold text-red-600">{formatCurrency(repCostTotal)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-700 font-bold uppercase text-xs">
                      Pozostały budżet do dyspozycji:
                    </span>
                    <span className="font-black text-emerald-700">
                      {formatCurrency(currentBudget - currentTotalCosts)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {reportConfig.issues && data.repIssues.length > 0 && (
            <div className="mb-10 break-inside-avoid">
              <h3 className="text-sm uppercase font-bold text-slate-800 mb-3 border-b pb-2">
                Rejestr Usterek (Punch-list)
              </h3>
              <table className="w-full text-xs border-collapse border border-slate-300">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border p-2 text-left">Usterka / Lokalizacja</th>
                    <th className="border p-2 text-left">Priorytet</th>
                    <th className="border p-2 text-left">Wykonawca</th>
                    <th className="border p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.repIssues.map((iss) => (
                    <tr key={iss.id} className="break-inside-avoid">
                      <td className="border p-2">
                        <strong>{iss.title}</strong>
                        {iss.location && <span className="block text-slate-500">Lok.: {iss.location}</span>}
                        {iss.description && <span className="block text-slate-600 mt-0.5">{iss.description}</span>}
                      </td>
                      <td className="border p-2 font-bold">{iss.priority || "Ważna"}</td>
                      <td className="border p-2">{getShortUserName(iss.assignee) || "-"}</td>
                      <td className="border p-2 font-bold uppercase">{iss.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportConfig.logs && data.repLogs.length > 0 && (
            <div className="mb-10 break-inside-avoid">
              <h3 className="text-sm uppercase font-bold text-slate-800 mb-3 border-b pb-2">
                Dziennik Przebiegu Robót
              </h3>
              <div className="space-y-4">
                {data.repLogs.map((l) => (
                  <div key={l.id} className="text-sm pb-3 break-inside-avoid border-b border-slate-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-900">{l.dateString}</span>
                      <span className="text-xs text-slate-500">
                        {l.weather && `Pogoda: ${l.weather}`}
                        {l.temp && ` | Temp: ${l.temp}°C`}
                        {l.workers && ` | Załoga: ${l.workers} os.`}
                      </span>
                    </div>
                    <div className="text-slate-700 whitespace-pre-wrap pl-3 border-l-2 border-amber-500">
                      {l.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reportConfig.agreementsInwestor && data.repAgreementsInwestor.length > 0 && (
            <div className="mb-10 break-inside-avoid">
              <h3 className="text-sm uppercase font-bold text-slate-800 mb-3 border-b pb-2">
                Ustalenia z Inwestorem
              </h3>
              <div className="space-y-2.5">
                {data.repAgreementsInwestor.map((a) => (
                  <div key={a.id} className="bg-slate-50 p-3 rounded-lg border text-sm break-inside-avoid">
                    <div className="text-xs font-bold text-slate-500 mb-1">{a.dateString}</div>
                    <div>{a.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reportConfig.agreementsBudowa && data.repAgreementsBudowa.length > 0 && (
            <div className="mb-10 break-inside-avoid">
              <h3 className="text-sm uppercase font-bold text-slate-800 mb-3 border-b pb-2">
                Ustalenia Wykonawcze na Budowie
              </h3>
              <div className="space-y-2.5">
                {data.repAgreementsBudowa.map((a) => (
                  <div key={a.id} className="bg-slate-50 p-3 rounded-lg border text-sm break-inside-avoid">
                    <div className="text-xs font-bold text-slate-500 mb-1">{a.dateString}</div>
                    <div>{a.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reportConfig.agreementsRada && data.repAgreementsRada.length > 0 && (
            <div className="mb-10 break-inside-avoid">
              <h3 className="text-sm uppercase font-bold text-slate-800 mb-3 border-b pb-2">
                Protokoły z Rad Budowy
              </h3>
              <div className="space-y-2.5">
                {data.repAgreementsRada.map((a) => (
                  <div key={a.id} className="bg-slate-50 p-3 rounded-lg border text-sm break-inside-avoid">
                    <div className="text-xs font-bold text-slate-500 mb-1">{a.dateString}</div>
                    <div>{a.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reportConfig.checklists && completedChecklistItems > 0 && (
            <div className="mb-10 break-inside-avoid">
              <h3 className="text-sm uppercase font-bold text-slate-800 mb-3 border-b pb-2">
                Odebrane Etapy i Elementy Robót
              </h3>
              <div className="columns-2 gap-6 text-xs text-slate-700">
                {Object.entries(currentChecklistTemplate).map(([stage, items]) => {
                  const completed = items.filter((_, i) => currentCState[`${stage}_${i}`]);
                  if (completed.length === 0) return null;
                  return (
                    <div key={stage} className="break-inside-avoid mb-4">
                      <h4 className="font-bold text-slate-900 mb-1 bg-slate-100 p-1.5 rounded">
                        {stage}
                      </h4>
                      <ul className="list-disc pl-4 space-y-1">
                        {completed.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {reportConfig.photos && data.repPhotos.length > 0 && (
            <div className="mb-10 page-break">
              <h3 className="text-sm uppercase font-bold text-slate-800 mb-3 border-b pb-2">
                Dokumentacja Fotograficzna
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {data.repPhotos.map((p) => (
                  <div key={p.id} className="border p-2 rounded-lg text-center break-inside-avoid">
                    <img
                      src={p.imageBase64}
                      className="w-full h-48 object-cover rounded mb-2"
                      alt="Foto"
                    />
                    <div className="text-[10px] text-slate-500 font-bold">{p.dateString}</div>
                    {p.description && <div className="text-xs mt-1">{p.description}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-16 pt-8 border-t flex justify-between break-inside-avoid">
            <div className="text-center w-56 border-t border-slate-800 pt-2">
              <p className="text-xs uppercase font-bold">Podpis Inwestora</p>
            </div>
            <div className="text-center w-56 border-t border-slate-800 pt-2">
              <p className="text-xs uppercase font-bold">
                Podpis Inspektora Nadzoru / Koordynatora
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // EKRAN GŁÓWNY (PORTFOLIO BUDÓW + PANEL ZARZĄDCZY ADMINA)
  // =====================================================================
  if (currentScreen === "home") {
    return (
      <div className="flex flex-col h-screen bg-slate-100 overflow-hidden font-sans">
        <header className="bg-slate-900 text-white px-6 py-4 shadow-lg flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="bg-amber-500/15 border border-amber-500/30 p-2 rounded-xl">
              <HardHat className="w-7 h-7 text-amber-500" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">NADZÓR BUDOWLANY</h1>
              <p className="text-[11px] text-slate-400 font-medium">
                Użytkownik: <strong className="text-white">{userData.displayName || user.email}</strong>{" "}
                <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-[10px] uppercase font-bold ml-1">
                  {userData.role}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAdministrator && (
              <button
                onClick={() => {
                  resetProjectForm();
                  setIsProjectModalOpen(true);
                }}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition"
              >
                <Plus className="w-4 h-4" /> Nowa Inwestycja
              </button>
            )}
            <button
              onClick={() => auth.signOut()}
              className="bg-slate-800 hover:bg-slate-700 p-2.5 rounded-xl text-slate-300 hover:text-white transition"
              title="Wyloguj"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 max-w-7xl w-full mx-auto">
          {/* ZBIORCZY PANEL ADMINISTRATORA: ZADANIA I USTERKI */}
          {isAdministrator && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-amber-400" /> Centrum Dowodzenia (Wszystkie Inwestycje)
                </h3>
                <div className="flex gap-2 text-xs">
                  <span className="bg-red-500/20 text-red-300 border border-red-500/30 px-2.5 py-1 rounded-lg font-bold">
                    Pilne: {overdueGlobalTasks.length + globalIssues.length}
                  </span>
                  <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg font-bold">
                    Aktywne budowy: {projects.length}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                {/* 1. Kolumna: Zaległe Zadania i Usterki */}
                <div className="p-5 bg-red-50/20">
                  <h4 className="text-xs uppercase font-black text-red-700 mb-3 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Wymagające interwencji ({overdueGlobalTasks.length + globalIssues.length})
                  </h4>
                  {overdueGlobalTasks.length === 0 && globalIssues.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm bg-white rounded-xl border border-dashed">
                      Brak przeterminowanych zadań i otwartych usterek.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                      {globalIssues.map((iss, idx) => (
                        <div
                          key={`iss_${idx}`}
                          onClick={() => {
                            setActiveProjectId(iss.projectId);
                            setCurrentScreen("project");
                            setActiveTab("usterki");
                          }}
                          className="bg-white border-l-4 border-l-red-600 border border-slate-200 p-3.5 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-slate-900">{iss.projName}</span>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-100 text-red-700">
                              Usterka • {iss.priority}
                            </span>
                          </div>
                          <p className="text-sm text-slate-800 font-semibold">{iss.title}</p>
                          <div className="mt-2 flex justify-between items-center text-[11px] text-slate-500">
                            <span>
                              Zgłoszona: {iss.dateStr}{" "}
                              {iss.assignee && `| Wykonawca: ${getShortUserName(iss.assignee)}`}
                            </span>
                            <span className="uppercase font-bold text-red-600">{iss.status}</span>
                          </div>
                        </div>
                      ))}

                      {overdueGlobalTasks.map((t, idx) => (
                        <div
                          key={`t_${idx}`}
                          onClick={() => {
                            setActiveProjectId(t.projectId);
                            setCurrentScreen("project");
                            setActiveTab(t.type === "Delegowane" ? "zadania" : "harmonogram");
                          }}
                          className="bg-white border-l-4 border-l-amber-500 border border-slate-200 p-3.5 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-slate-800">{t.projName}</span>
                            <span className="text-[10px] font-mono text-red-700 bg-red-100 px-2 py-0.5 rounded font-bold">
                              TERMIN: {t.dateStr}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 font-medium">{t.title}</p>
                          <div className="mt-2 flex justify-between items-center text-[11px] text-slate-500">
                            <span>
                              {t.type} {t.assignee && `• ${getShortUserName(t.assignee)}`}
                            </span>
                            <span className="uppercase font-bold text-amber-600">{t.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Kolumna: Nadchodzące Zadania */}
                <div className="p-5">
                  <h4 className="text-xs uppercase font-black text-slate-700 mb-3 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" /> Harmonogram nadchodzących prac ({upcomingGlobalTasks.length})
                  </h4>
                  {upcomingGlobalTasks.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed">
                      Brak zaplanowanych zadań w najbliższych dniach.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                      {upcomingGlobalTasks.map((t, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setActiveProjectId(t.projectId);
                            setCurrentScreen("project");
                            setActiveTab(t.type === "Delegowane" ? "zadania" : "harmonogram");
                          }}
                          className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm cursor-pointer hover:border-slate-400 transition"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-slate-900">{t.projName}</span>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                                t.dateStr === todayStr
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {t.dateStr === todayStr ? "DZISIAJ" : t.dateStr}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 font-medium">{t.title}</p>
                          <div className="mt-2 flex justify-between items-center text-[11px] text-slate-500">
                            <span>
                              {t.type} {t.assignee && `• ${getShortUserName(t.assignee)}`}
                            </span>
                            {t.status && (
                              <span className="uppercase font-bold text-blue-600">{t.status}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* KARTY INWESTYCJI */}
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-700" /> Prowadzone Inwestycje Budowlane
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {availableProjects.length === 0 && (
                <div className="bg-white rounded-2xl border p-10 text-center text-slate-400 col-span-full">
                  Brak przypisanych budów do Twojego konta.
                </div>
              )}
              {availableProjects.map((p) => {
                const prog = getProjectProgress(p.id);
                const pBudget = budgets[p.id] || 0;
                const pCosts = costs
                  .filter((c) => c.projectId === p.id)
                  .reduce((a, b) => a + (b.amount || 0), 0);
                const openIss = issues.filter(
                  (i) => i.projectId === p.id && i.status !== "Zaakceptowana"
                ).length;

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setActiveProjectId(p.id);
                      setCurrentScreen("project");
                      setActiveTab(
                        isAdministrator
                          ? "poranna"
                          : canViewTab("info")
                          ? "info"
                          : "dziennik"
                      );
                    }}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 cursor-pointer hover:shadow-lg hover:border-amber-500 transition flex flex-col justify-between relative group"
                  >
                    {isAdministrator && (
                      <div className="absolute top-4 right-4 flex gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(p);
                          }}
                          className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-amber-100 hover:text-amber-700 transition"
                          title="Edytuj budowę"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProjectToDelete(p.id);
                          }}
                          className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-red-100 hover:text-red-600 transition"
                          title="Usuń budowę"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-slate-900 text-amber-400 text-[10px] font-black uppercase px-2.5 py-1 rounded-md">
                          Odbiory: {prog}%
                        </span>
                        {openIss > 0 && (
                          <span className="bg-red-100 text-red-700 text-[10px] font-bold uppercase px-2 py-1 rounded-md flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {openIss} usterek
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-amber-600 transition pr-16">
                        {p.name}
                      </h3>
                      {p.investor && (
                        <p className="text-xs text-slate-500 mt-1">
                          Inwestor: <strong className="text-slate-700">{p.investor}</strong>
                        </p>
                      )}
                      {p.location && (
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {p.location}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-full transition-all"
                          style={{ width: `${prog}%` }}
                        />
                      </div>
                      {isAdministrator && pBudget > 0 && (
                        <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                          <span>Koszty: <strong>{formatCurrency(pCosts)}</strong></span>
                          <span>Budżet: {formatCurrency(pBudget)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PANEL ADMINISTRATORA: UŻYTKOWNICY */}
          {isAdministrator && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-base">
                <ShieldCheck className="w-5 h-5 text-amber-500" /> Zarządzanie Zespołem, Inwestorami i Podwykonawcami
              </h3>
              <div className="space-y-4">
                {usersList.map((u) => (
                  <div
                    key={u.id}
                    className="border border-slate-200 p-4 rounded-xl bg-slate-50/70 space-y-4"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                      <div>
                        <p className="font-bold text-sm text-slate-900 flex items-center gap-2">
                          <UserPlus className="w-4 h-4 text-slate-500" />
                          {u.displayName || u.email}{" "}
                          <span className="text-xs text-slate-400 font-normal">({u.email})</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-2.5 mt-2">
                          <input
                            type="text"
                            placeholder="Imię i nazwisko / Firma"
                            defaultValue={u.displayName || ""}
                            onBlur={(e) => handleUpdateDisplayName(u.id, e.target.value)}
                            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold bg-white w-48"
                          />
                          <button
                            onClick={() => handleToggleApproval(u.id, u.approved)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition flex items-center gap-1 ${
                              u.approved
                                ? "bg-emerald-600 text-white"
                                : "bg-amber-500 text-slate-950"
                            }`}
                          >
                            {u.approved ? (
                              <>
                                <Unlock className="w-3 h-3" /> Aktywny
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3" /> Oczekuje
                              </>
                            )}
                          </button>
                          <select
                            value={u.role || "wykonawca"}
                            onChange={(e) => handleRoleChangeForUser(u.id, e.target.value)}
                            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold bg-white"
                          >
                            <option value="administrator">Administrator</option>
                            <option value="zarząd">Zarząd</option>
                            <option value="kierownik budowy">Kierownik budowy</option>
                            <option value="inspektor">Inspektor</option>
                            <option value="przedstawiciel inwestora">Przedstawiciel inwestora</option>
                            <option value="inwestor">Inwestor</option>
                            <option value="pracownik">Pracownik firmy</option>
                            <option value="wykonawca">Wykonawca</option>
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={() => setUserToDelete(u.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                        title="Usuń konto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                          Kolor identyfikacyjny w harmonogramie:
                        </span>
                        <select
                          value={u.color || "bg-slate-500"}
                          onChange={(e) => handleUserColorChange(u.id, e.target.value)}
                          className="border rounded-lg p-1.5 text-xs font-bold bg-white w-full"
                        >
                          <option value="bg-slate-500">Szary</option>
                          <option value="bg-blue-500">Niebieski</option>
                          <option value="bg-emerald-500">Zielony</option>
                          <option value="bg-red-500">Czerwony</option>
                          <option value="bg-amber-500">Pomarańczowy</option>
                          <option value="bg-purple-500">Fioletowy</option>
                          <option value="bg-pink-500">Różowy</option>
                        </select>
                      </div>

                      {u.role === "wykonawca" && (
                        <div>
                          <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                            Zakres robót podwykonawcy:
                          </span>
                          <input
                            type="text"
                            placeholder="Np. Stan surowy, instalacje wod-kan, dach..."
                            value={u.contractorScope || ""}
                            onChange={(e) => handleSaveContractorScope(u.id, e.target.value)}
                            className="w-full border rounded-lg p-1.5 text-xs bg-white"
                          />
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">
                          Widoczność modułów:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(u.permissions || {}).map(([tabKey, isAllowed]) => (
                            <button
                              key={tabKey}
                              onClick={() => handleTogglePermission(u.id, u.permissions, tabKey)}
                              className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                isAllowed
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {tabKey}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">
                          Prawo zapisu / edycji:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(u.editPermissions || {}).map(([tabKey, canEdit]) => (
                            <button
                              key={tabKey}
                              onClick={() =>
                                handleToggleEditPermission(u.id, u.editPermissions, tabKey)
                              }
                              className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                canEdit
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {tabKey}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">
                          Dostęp do ustaleń:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(
                            u.agreementPermissions || { inwestor: true, budowa: true, rada: true }
                          ).map(([agrKey, agrAllowed]) => (
                            <button
                              key={agrKey}
                              onClick={() =>
                                handleToggleAgreementPermission(
                                  u.id,
                                  u.agreementPermissions || {
                                    inwestor: true,
                                    budowa: true,
                                    rada: true,
                                  },
                                  agrKey
                                )
                              }
                              className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                agrAllowed
                                  ? "bg-purple-100 text-purple-800 border border-purple-300"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {agrKey}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200">
                      <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">
                        Przypisane inwestycje:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {projects.map((proj) => {
                          const isAssigned = (u.assignedProjects || []).includes(proj.id);
                          return (
                            <button
                              key={proj.id}
                              onClick={() =>
                                handleToggleProjectAssignment(
                                  u.id,
                                  u.assignedProjects || [],
                                  proj.id
                                )
                              }
                              className={`text-xs px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 transition ${
                                isAssigned
                                  ? "bg-slate-900 text-amber-400 border-slate-900"
                                  : "bg-white text-slate-600 border-slate-300"
                              }`}
                            >
                              <FolderPlus className="w-3.5 h-3.5" /> {proj.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* MODAL USUWANIA UŻYTKOWNIKA */}
        {userToDelete && (
          <div className="fixed inset-0 bg-slate-950/75 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl">
              <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center text-red-600 mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold mb-2">Usunąć użytkownika?</h2>
              <p className="text-sm text-slate-500 mb-6">
                Użytkownik straci dostęp do przypisanych inwestycji.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Anuluj
                </button>
                <button
                  onClick={executeDeleteUserRecord}
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-md"
                >
                  Usuń Trwale
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NAPRAWIONY MODAL USUWANIA BUDOWY */}
        {projectToDelete && (
          <div className="fixed inset-0 bg-slate-950/75 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl">
              <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center text-red-600 mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold mb-2">Usunąć inwestycję?</h2>
              <p className="text-sm text-slate-500 mb-6">
                Czy na pewno chcesz usunąć tę budowę z listy aktywnych projektów?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setProjectToDelete(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Anuluj
                </button>
                <button
                  onClick={executeDeleteProject}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md"
                >
                  Usuń Budowę
                </button>
              </div>
            </div>
          </div>
        )}

        {renderProjectModal()}
        {renderLightbox()}
      </div>
    );
  }

  // =====================================================================
  // WIDOK PROJEKTU BUDOWLANEGO (BEZ DOLNEGO PASKA - ZINTEGROWANY GÓRNY PANEL)
  // =====================================================================
  return (
    <div className="flex flex-col h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      {/* ZINTEGROWANY GÓRNY PASEK NAWIGACYJNY */}
      <div className="flex-shrink-0 z-20 print:hidden bg-slate-900 text-white shadow-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setCurrentScreen("home")}
              className="bg-slate-800 hover:bg-slate-700 p-2.5 rounded-xl text-slate-200 hover:text-white transition flex items-center gap-1.5 text-xs font-bold"
              title="Powrót do listy budów"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Budowy</span>
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight truncate">
                  {activeProjectData?.name}
                </h1>
                <span className="hidden md:inline-block bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                  {globalProgress}% Odbiorów
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {activeProjectData?.location || "Brak wpisanej lokalizacji"} •{" "}
                <span className="text-amber-400 uppercase font-bold">{userData.role}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEditTab("info") && (
              <button
                onClick={() => openEditModal(activeProjectData)}
                className="bg-slate-800 hover:bg-slate-700 p-2 rounded-xl text-slate-300 hover:text-white transition"
                title="Edytuj dane budowy"
              >
                <SettingsIco className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* GÓRNE MENU MODUŁÓW (Zastępuje stary dolny pasek) */}
        <div className="bg-slate-950/60 border-t border-slate-800/80 px-4">
          <nav className="max-w-7xl mx-auto flex overflow-x-auto [&::-webkit-scrollbar]:hidden gap-1 py-1.5">
            {[
              { id: "poranna", icon: Sun, label: "Odprawa", key: "poranna", adminOnly: true },
              { id: "info", icon: Info, label: "Metryczka", key: "info" },
              { id: "dziennik", icon: BookOpen, label: "Dziennik", key: "dziennik" },
              { id: "ustalenia", icon: Handshake, label: "Ustalenia", key: "ustalenia" },
              { id: "harmonogram", icon: CalendarDays, label: "Harmonogram", key: "harmonogram" },
              { id: "checklisty", icon: ClipboardCheck, label: "Odbiory", key: "checklisty" },
              { id: "usterki", icon: Wrench, label: "Usterki", key: "usterki", badge: activeProjIssuesCount },
              { id: "zadania", icon: CheckSquare, label: "Polecenia", key: "zadania" },
              { id: "oferty", icon: FileSpreadsheet, label: "Oferty", key: "oferty" },
              { id: "finanse", icon: Wallet, label: "Finanse", key: "finanse" },
              { id: "dokumenty", icon: FolderOpen, label: "Dokumentacja", key: "dokumenty" },
              { id: "zdjecia", icon: ImageIcon, label: "Fotorelacja", key: "zdjecia" },
              { id: "raporty", icon: FileText, label: "Raport PDF", key: "raporty" },
            ].map((t) => {
              if (t.adminOnly && !isAdministrator) return null;
              if (!t.adminOnly && t.key !== "poranna" && !canViewTab(t.key)) return null;
              const IconComp = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 py-2 px-3.5 whitespace-nowrap rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-amber-500 text-slate-950 shadow-md"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                  <span>{t.label}</span>
                  {t.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        isActive ? "bg-slate-950 text-amber-400" : "bg-red-600 text-white"
                      }`}
                    >
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* GŁÓWNY OBSZAR ROBOCZY */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 print:p-0">
        <div className="max-w-5xl mx-auto print:max-w-full pb-10">
          {/* OFERTY */}
          {activeTab === "oferty" && (
            <div className="space-y-6 animate-in fade-in">
              {canEditTab("oferty") && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 border-t-4 border-t-amber-500 print:hidden">
                  <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-amber-500" /> Dodaj ofertę podwykonawcy / wycenę materiałową
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Dostawca / Podwykonawca / Hurtownia"
                      value={newOfferSupplier}
                      onChange={(e) => setNewOfferSupplier(e.target.value)}
                      className="border border-slate-300 rounded-xl p-2.5 text-sm bg-slate-50"
                    />
                    <select
                      value={newOfferStatus}
                      onChange={(e) => setNewOfferStatus(e.target.value)}
                      className="border border-slate-300 rounded-xl p-2.5 text-sm bg-slate-50 font-bold"
                    >
                      <option value="Oczekuje">Status: Weryfikacja / Oczekuje</option>
                      <option value="Zaakceptowana">Status: Zaakceptowana do realizacji</option>
                      <option value="Odrzucona">Status: Odrzucona</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                        Cena zakupu / Koszt wykonawczy (PLN):
                      </label>
                      <input
                        type="number"
                        placeholder="Kwota netto/brutto"
                        value={newOfferCostPrice}
                        onChange={(e) => setNewOfferCostPrice(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl p-2.5 text-sm bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                        Budżet z Inwestorem (PLN):
                      </label>
                      <input
                        type="number"
                        placeholder="Kwota ofertowa dla Inwestora"
                        value={newOfferInvestorPrice}
                        onChange={(e) => setNewOfferInvestorPrice(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl p-2.5 text-sm bg-slate-50"
                      />
                    </div>
                  </div>
                  <textarea
                    placeholder="Szczegółowy zakres oferty, parametry techniczne, warunki płatności..."
                    value={newOfferDesc}
                    onChange={(e) => setNewOfferDesc(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm bg-slate-50 min-h-[70px] mb-3"
                  />
                  <button
                    onClick={() => {
                      if (!newOfferSupplier.trim() || !newOfferCostPrice) return;
                      genericAdd(
                        "ins_offers",
                        {
                          supplier: newOfferSupplier,
                          description: newOfferDesc,
                          costPrice: parseFloat(newOfferCostPrice) || 0,
                          investorPrice: parseFloat(newOfferInvestorPrice) || 0,
                          status: newOfferStatus,
                          dateStr: new Date().toLocaleDateString("pl-PL"),
                        },
                        () => {
                          setNewOfferSupplier("");
                          setNewOfferDesc("");
                          setNewOfferCostPrice("");
                          setNewOfferInvestorPrice("");
                        }
                      );
                    }}
                    disabled={!newOfferSupplier.trim() || !newOfferCostPrice}
                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold shadow-sm transition"
                  >
                    Zarejestruj ofertę w bazie
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {projOffers.length === 0 && (
                  <div className="bg-white rounded-2xl border p-10 text-center text-slate-400">
                    Brak zarejestrowanych ofert dla tej inwestycji.
                  </div>
                )}
                {projOffers.map((off) => {
                  const profit = (off.investorPrice || 0) - (off.costPrice || 0);
                  const isEditing = editingOfferId === off.id;
                  return (
                    <div
                      key={off.id}
                      className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 relative border-l-4 border-l-slate-900"
                    >
                      {canEditTab("oferty") && (
                        <div className="absolute top-4 right-4 flex gap-2">
                          <button
                            onClick={() => {
                              if (isEditing) {
                                genericUpdate("ins_offers", off.id, {
                                  supplier: editOfferSupplier,
                                  description: editOfferDesc,
                                  costPrice: parseFloat(editOfferCostPrice) || 0,
                                  investorPrice: parseFloat(editOfferInvestorPrice) || 0,
                                  status: editOfferStatus,
                                });
                                setEditingOfferId(null);
                              } else {
                                setEditingOfferId(off.id);
                                setEditOfferSupplier(off.supplier || "");
                                setEditOfferDesc(off.description || "");
                                setEditOfferCostPrice(off.costPrice || "");
                                setEditOfferInvestorPrice(off.investorPrice || "");
                                setEditOfferStatus(off.status || "Oczekuje");
                              }
                            }}
                            className="text-slate-500 hover:text-blue-600 p-1.5 bg-slate-100 rounded-lg"
                          >
                            <EditIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => genericDel("ins_offers", off.id)}
                            className="text-slate-400 hover:text-red-600 p-1.5 bg-slate-100 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {isEditing ? (
                        <div className="space-y-3 pt-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={editOfferSupplier}
                              onChange={(e) => setEditOfferSupplier(e.target.value)}
                              className="border rounded-lg p-2 text-sm bg-slate-50"
                            />
                            <select
                              value={editOfferStatus}
                              onChange={(e) => setEditOfferStatus(e.target.value)}
                              className="border rounded-lg p-2 text-sm font-bold bg-slate-50"
                            >
                              <option value="Oczekuje">Oczekuje</option>
                              <option value="Zaakceptowana">Zaakceptowana</option>
                              <option value="Odrzucona">Odrzucona</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <input
                              type="number"
                              value={editOfferCostPrice}
                              onChange={(e) => setEditOfferCostPrice(e.target.value)}
                              className="border rounded-lg p-2 text-sm bg-slate-50"
                            />
                            <input
                              type="number"
                              value={editOfferInvestorPrice}
                              onChange={(e) => setEditOfferInvestorPrice(e.target.value)}
                              className="border rounded-lg p-2 text-sm bg-slate-50"
                            />
                          </div>
                          <textarea
                            value={editOfferDesc}
                            onChange={(e) => setEditOfferDesc(e.target.value)}
                            className="w-full border rounded-lg p-2 text-sm bg-slate-50"
                          />
                          <button
                            onClick={() => {
                              genericUpdate("ins_offers", off.id, {
                                supplier: editOfferSupplier,
                                description: editOfferDesc,
                                costPrice: parseFloat(editOfferCostPrice) || 0,
                                investorPrice: parseFloat(editOfferInvestorPrice) || 0,
                                status: editOfferStatus,
                              });
                              setEditingOfferId(null);
                            }}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold"
                          >
                            Zapisz zmiany
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-3 pr-20">
                            <div>
                              <h4 className="font-bold text-base text-slate-900">
                                {off.supplier}
                              </h4>
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase mt-1 ${
                                  off.status === "Zaakceptowana"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : off.status === "Odrzucona"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {off.status}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400 font-mono">
                              {off.dateStr}
                            </span>
                          </div>

                          {off.description && (
                            <p className="text-sm text-slate-600 mb-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                              {off.description}
                            </p>
                          )}

                          <div className="grid grid-cols-3 gap-3 pt-3 border-t text-center">
                            <div className="bg-slate-50 p-2.5 rounded-xl">
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                                Koszt wykonawczy
                              </span>
                              <span className="font-bold text-slate-800 text-sm">
                                {formatCurrency(off.costPrice)}
                              </span>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-xl">
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                                Oferta dla Inwestora
                              </span>
                              <span className="font-bold text-blue-600 text-sm">
                                {formatCurrency(off.investorPrice)}
                              </span>
                            </div>
                            <div
                              className={`p-2.5 rounded-xl ${
                                profit >= 0
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              <span className="text-[10px] uppercase font-bold block opacity-75">
                                Różnica / Marża
                              </span>
                              <span className="font-black text-sm">
                                {formatCurrency(profit)}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ODPRAWA PORANNA (TYLKO ADMIN) */}
          {activeTab === "poranna" && isAdministrator && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 border-t-4 border-t-amber-500">
                <div className="flex justify-between items-center mb-6 print:hidden">
                  <div className="flex items-center gap-3.5">
                    <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
                      <Sun className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900">
                        Poranna Odprawa Koordynacyjna
                      </h2>
                      <p className="text-xs text-slate-500">
                        Priorytety na dziś i bieżący tydzień dla inwestycji:{" "}
                        <strong className="text-slate-800">{activeProjectData?.name}</strong>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow transition"
                  >
                    <Printer className="w-4 h-4" /> Drukuj Kartę Odprawy
                  </button>
                </div>

                <div className="mb-8">
                  <h3 className="text-xs uppercase font-black text-slate-500 mb-3 border-b pb-2 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block"></span>
                    Plan na Dzisiaj ({new Date().toLocaleDateString("pl-PL")})
                  </h3>
                  {todayTasks.length === 0 ? (
                    <p className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-dashed">
                      Brak zaplanowanych pozycji w harmonogramie na dzisiaj.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {todayTasks.map((t) => (
  <div key={t.id} className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
    <input
      type="checkbox"
      checked={t.isCompleted || false}
      onChange={(e) => genericUpdate("ins_tasks", t.id, { isCompleted: e.target.checked })}
      className="w-5 h-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
    />
    <span className={`text-sm flex-1 ${t.isCompleted ? 'text-slate-400 line-through font-medium' : 'text-slate-800 font-semibold'}`}>
      {t.title || t.task}
    </span>
  </div>
))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xs uppercase font-black text-slate-500 mb-3 border-b pb-2 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block"></span>
                    Zakres na Bieżący Tydzień Roboczy
                  </h3>
                  {weekTasks.length === 0 ? (
                    <p className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-dashed">
                      Brak zaplanowanych zadań w tym tygodniu.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {weekTasks.map((t) => (
  <div key={t.id} className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
    <input
      type="checkbox"
      checked={t.isCompleted || false}
      onChange={(e) => genericUpdate("ins_tasks", t.id, { isCompleted: e.target.checked })}
      className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
    />
    <span className={`text-sm flex-1 ${t.isCompleted ? 'text-slate-400 line-through' : 'text-slate-800 font-medium'}`}>
      {t.title || t.task}
    </span>
    <span className="text-xs px-2.5 py-1 bg-white border text-slate-700 rounded-lg font-mono font-bold">
      {t.date}
    </span>
  </div>
))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* METRYCZKA / INFO Z MAPĄ I POGODĄ */}
          {activeTab === "info" && canViewTab("info") && (
            <div className="space-y-5 animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 border-t-4 border-t-amber-500 relative">
                {canEditTab("info") && (
                  <button
                    onClick={() => openEditModal(activeProjectData)}
                    className="absolute top-5 right-5 bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <EditIcon className="w-3.5 h-3.5" /> Edytuj Metryczkę
                  </button>
                )}
                <div className="flex items-start gap-4">
                  <div className="bg-slate-900 text-amber-400 p-3.5 rounded-2xl">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <div className="pr-24">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                      Karta Informacyjna Inwestycji
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 mt-0.5">
                      {activeProjectData?.name}
                    </h2>
                    <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap leading-relaxed">
                      {activeProjectData?.description || "Brak szczegółowego opisu technicznego inwestycji."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex gap-3.5 items-start">
                  <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase">
                      Inwestor
                    </p>
                    <p className="font-bold text-slate-800 mt-0.5">
                      {activeProjectData?.investor || "Nie określono"}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex gap-3.5 items-start">
                  <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase">
                      Telefon Inwestora / Kierownika
                    </p>
                    {activeProjectData?.phone ? (
                      <a
                        href={`tel:${activeProjectData.phone}`}
                        className="font-bold text-emerald-700 hover:underline mt-0.5 block"
                      >
                        {activeProjectData.phone}
                      </a>
                    ) : (
                      <p className="font-bold text-slate-800 mt-0.5">Brak numeru</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex gap-3.5 items-start relative overflow-hidden">
                  <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600 z-10">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="z-10 relative">
                    <p className="text-[11px] text-slate-400 font-bold uppercase">
                      Lokalizacja Placu Budowy
                    </p>
                    <p className="font-bold text-slate-800 mt-0.5">
                      {activeProjectData?.location || "Brak adresu"}
                    </p>
                    {activeProjectData?.location && (
                      <a
                        href={`https://www.google.com/search?q=pogoda+${encodeURIComponent(
                          activeProjectData.location
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex mt-2 items-center gap-1.5 bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg text-[10px] font-bold hover:bg-amber-200 transition"
                      >
                        <CloudSun className="w-3.5 h-3.5" /> Prognoza dla budowy
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* SEKCJA MAPY GOOGLE */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" /> Nawigacja i Pinezka Dojazdowa
                  </h3>
                  {activeProjectData?.mapUrl && (
                    <div className="flex gap-2">
                      <a
                        href={activeProjectData.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-slate-900 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-slate-800 transition"
                      >
                        Otwórz w Google Maps
                      </a>
                      <button
                        onClick={() => {
                          if (navigator.share) {
                            navigator
                              .share({
                                title: activeProjectData.name,
                                text: `Dojazd na budowę: ${activeProjectData.name}`,
                                url: activeProjectData.mapUrl,
                              })
                              .catch(console.error);
                          } else {
                            navigator.clipboard.writeText(activeProjectData.mapUrl);
                            alert("Skopiowano link do pinezki dla dostawcy!");
                          }
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold transition"
                      >
                        Kopiuj dla dostawcy (Beton/HDS)
                      </button>
                    </div>
                  )}
                </div>

                {activeProjectData?.mapUrl ? (
                  <div className="w-full h-80 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    <iframe
                      title="Mapa Google"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(
                        activeProjectData.mapUrl
                      )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      className="w-full h-full border-0"
                      allowFullScreen=""
                      loading="lazy"
                    ></iframe>
                  </div>
                ) : (
                  <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <p className="text-sm text-slate-500 mb-2">
                      Brak przypiętej lokalizacji GPS dla dostawców i podwykonawców.
                    </p>
                    {canEditTab("info") && (
                      <button
                        onClick={() => openEditModal(activeProjectData)}
                        className="text-xs text-amber-600 font-bold hover:underline"
                      >
                        + Dodaj link do pinezki w edycji metryczki
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DZIENNIK BUDOWY (Z POGODĄ, TEMPERATURĄ, ZAŁOGĄ I SZABLONAMI INSPEKTORSKIMI) */}
          {activeTab === "dziennik" && (
            <div className="space-y-6 animate-in fade-in">
              {canEditTab("dziennik") && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 border-t-4 border-t-amber-500 print:hidden">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4 border-b pb-3">
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-500" /> Nowy Wpis w Dzienniku Budowy
                    </h2>
                    <input
                      type="datetime-local"
                      value={newLogCustomDate}
                      onChange={(e) => setNewLogCustomDate(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono"
                    />
                  </div>

                  {/* PARAMETRY DZIENNE: POGODA, TEMPERATURA, LICZBA PRACOWNIKÓW */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
                        Warunki atmosferyczne:
                      </label>
                      <div className="flex gap-1">
                        {WEATHER_OPTIONS.map((w) => (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => setNewLogWeather(w.label)}
                            title={w.label}
                            className={`flex-1 py-1.5 rounded-lg text-sm border transition ${
                              newLogWeather === w.label
                                ? "bg-amber-500/20 border-amber-500 font-bold shadow-sm"
                                : "bg-white border-slate-200 opacity-60 hover:opacity-100"
                            }`}
                          >
                            {w.icon}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
                        Temperatura powietrza (°C):
                      </label>
                      <div className="relative">
                        <Thermometer className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="np. +14°C / rano +5°C"
                          value={newLogTemp}
                          onChange={(e) => setNewLogTemp(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
                        Stan osobowy (liczba pracowników):
                      </label>
                      <div className="relative">
                        <Users className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="number"
                          placeholder="np. 6"
                          value={newLogWorkers}
                          onChange={(e) => setNewLogWorkers(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SZYBKIE SZABLONY WPISÓW INSPEKTORA */}
                  <div className="mb-3">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
                      Szybkie formuły inspektorskie (kliknij, aby wstawić):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_LOG_TEMPLATES.map((tpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            setNewLogText((prev) => (prev ? `${prev}\n${tpl}` : tpl))
                          }
                          className="text-[11px] bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 transition text-left truncate max-w-xs"
                        >
                          + {tpl.slice(0, 48)}...
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    value={newLogText}
                    onChange={(e) => setNewLogText(e.target.value)}
                    placeholder="Wpisz szczegółowy przebieg robót, odebrane elementy, zalecenia nadzoru..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-sm min-h-[110px] focus:ring-2 focus:ring-amber-500 outline-none"
                  />

                  {newLogPhotoBase64 && (
                    <div className="mt-3 relative inline-block">
                      <img
                        src={newLogPhotoBase64}
                        alt="Załącznik"
                        className="h-24 rounded-xl object-cover border"
                      />
                      <button
                        onClick={() => setNewLogPhotoBase64(null)}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="mt-3 flex justify-between items-center">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={logPhotoRef}
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          compressImage(e.target.files[0], (b64) => {
                            if (b64) setNewLogPhotoBase64(b64);
                            if (logPhotoRef.current) logPhotoRef.current.value = "";
                          });
                        }
                      }}
                    />
                    <button
                      onClick={() => logPhotoRef.current?.click()}
                      className="text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs font-bold flex gap-1.5 items-center px-3.5 py-2.5 rounded-xl transition"
                    >
                      <Camera className="w-4 h-4" /> Dołącz zdjęcie do wpisu
                    </button>
                    <button
                      onClick={() => {
                        const d = newLogCustomDate
                          ? new Date(newLogCustomDate).toLocaleString("pl-PL")
                          : new Date().toLocaleString("pl-PL");
                        genericAdd(
                          "ins_logs",
                          {
                            text: newLogText,
                            dateString: d,
                            photoBase64: newLogPhotoBase64,
                            weather: newLogWeather,
                            temp: newLogTemp,
                            workers: newLogWorkers,
                          },
                          () => {
                            setNewLogText("");
                            setNewLogPhotoBase64(null);
                            setNewLogCustomDate("");
                            setNewLogTemp("");
                            setNewLogWorkers("");
                          }
                        );
                      }}
                      disabled={!newLogText.trim()}
                      className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition"
                    >
                      Zatwierdź wpis
                    </button>
                  </div>
                </div>
              )}

              {/* WYSZUKIWARKA W DZIENNIKU */}
              <div className="relative print:hidden">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Szukaj w dzienniku budowy (np. zbrojenie, beton, dach)..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm shadow-sm outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-4">
                {logs
                  .filter(
                    (l) =>
                      l.projectId === activeProjectId &&
                      (!logSearchQuery.trim() ||
                        (l.text || "")
                          .toLowerCase()
                          .includes(logSearchQuery.toLowerCase()))
                  )
                  .map((log) => {
                    const isEditing = editingLogId === log.id;
                    return (
                      <div
                        key={log.id}
                        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                      >
                        <div className="bg-slate-50 px-5 py-3 border-b flex flex-wrap justify-between items-center gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black text-slate-800 font-mono">
                              {log.dateString}
                            </span>
                            {log.weather && (
                              <span className="text-[11px] bg-white border px-2 py-0.5 rounded-md text-slate-600 font-medium">
                                {log.weather}
                              </span>
                            )}
                            {log.temp && (
                              <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-bold">
                                {log.temp}°C
                              </span>
                            )}
                            {log.workers && (
                              <span className="text-[11px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-bold">
                                Załoga: {log.workers} os.
                              </span>
                            )}
                            {log.authorEmail && (
                              <span className="text-[10px] text-slate-400">
                                • Wpisał: {getShortUserName(log.authorEmail)}
                              </span>
                            )}
                          </div>
                          {canEditTab("dziennik") && (
                            <div className="flex gap-1.5 print:hidden">
                              <button
                                onClick={() => {
                                  if (isEditing) {
                                    genericUpdate("ins_logs", log.id, {
                                      text: editLogText,
                                    });
                                    setEditingLogId(null);
                                  } else {
                                    setEditingLogId(log.id);
                                    setEditLogText(log.text || "");
                                  }
                                }}
                                className="text-slate-500 hover:text-blue-600 p-1"
                              >
                                <EditIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => genericDel("ins_logs", log.id)}
                                className="text-slate-400 hover:text-red-500 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="p-5">
                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea
                                value={editLogText}
                                onChange={(e) => setEditLogText(e.target.value)}
                                className="w-full border rounded-xl p-3 text-sm bg-slate-50 min-h-[80px]"
                              />
                              <button
                                onClick={() => {
                                  genericUpdate("ins_logs", log.id, {
                                    text: editLogText,
                                  });
                                  setEditingLogId(null);
                                }}
                                className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold"
                              >
                                Zapisz zmiany
                              </button>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                              {log.text}
                            </p>
                          )}
                          {log.photoBase64 && (
                            <img
                              src={log.photoBase64}
                              alt="Załącznik"
                              onClick={() =>
                                setLightboxImage({
                                  src: log.photoBase64,
                                  caption: log.text,
                                  date: log.dateString,
                                })
                              }
                              className="mt-4 rounded-xl max-h-64 border cursor-pointer hover:opacity-90 transition"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* USTALENIA */}
          {activeTab === "ustalenia" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex bg-slate-200/70 p-1.5 rounded-xl print:hidden">
                {[
                  { id: "inwestor", icon: Users, label: "Ustalenia z Inwestorem", key: "inwestor" },
                  { id: "budowa", icon: HardHat, label: "Ustalenia na Budowie", key: "budowa" },
                  { id: "rada", icon: Gavel, label: "Rady Budowy (Protokoły)", key: "rada" },
                ].map((t) => {
                  if (!canViewAgreementType(t.key)) return null;
                  const IconComp = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setAgreementType(t.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-lg text-xs font-bold transition ${
                        agreementType === t.id
                          ? "bg-slate-900 text-amber-400 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {canEditTab("ustalenia") && canViewAgreementType(agreementType) && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 border-l-4 border-l-amber-500 print:hidden">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold uppercase text-slate-500">
                      Nowa notatka / protokół ustaleń
                    </span>
                    <input
                      type="datetime-local"
                      value={newAgreementDate}
                      onChange={(e) => setNewAgreementDate(e.target.value)}
                      className="bg-slate-50 border rounded-lg p-1.5 text-xs font-mono"
                    />
                  </div>
                  <textarea
                    value={newAgreementText}
                    onChange={(e) => setNewAgreementText(e.target.value)}
                    placeholder="Wpisz treść uzgodnień, zmiany lokatorskie, decyzje materiałowe..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-sm min-h-[90px]"
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => {
                        const d = newAgreementDate
                          ? new Date(newAgreementDate).toLocaleString("pl-PL")
                          : new Date().toLocaleString("pl-PL");
                        genericAdd(
                          "ins_agreements",
                          {
                            type: agreementType,
                            text: newAgreementText,
                            dateString: d,
                          },
                          () => {
                            setNewAgreementText("");
                            setNewAgreementDate("");
                          }
                        );
                      }}
                      disabled={!newAgreementText.trim()}
                      className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition"
                    >
                      Zapisz ustalenie
                    </button>
                  </div>
                </div>
              )}

              {canViewAgreementType(agreementType) &&
                agreements
                  .filter(
                    (a) =>
                      a.projectId === activeProjectId && a.type === agreementType
                  )
                  .map((agr) => {
                    const isEditing = editingAgreementId === agr.id;
                    return (
                      <div
                        key={agr.id}
                        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 relative"
                      >
                        {canEditTab("ustalenia") && (
                          <div className="absolute top-4 right-4 flex gap-2 print:hidden">
                            <button
                              onClick={() => {
                                if (isEditing) {
                                  genericUpdate("ins_agreements", agr.id, {
                                    text: editAgreementText,
                                  });
                                  setEditingAgreementId(null);
                                } else {
                                  setEditingAgreementId(agr.id);
                                  setEditAgreementText(agr.text || "");
                                }
                              }}
                              className="text-slate-400 hover:text-blue-600 p-1"
                            >
                              <EditIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => genericDel("ins_agreements", agr.id)}
                              className="text-slate-300 hover:text-red-500 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        <div className="text-xs font-bold text-slate-400 font-mono mb-2">
                          {agr.dateString}
                        </div>
                        {isEditing ? (
                          <div className="space-y-2 mt-2">
                            <textarea
                              value={editAgreementText}
                              onChange={(e) => setEditAgreementText(e.target.value)}
                              className="w-full border rounded-xl p-3 text-sm bg-slate-50 min-h-[70px]"
                            />
                            <button
                              onClick={() => {
                                genericUpdate("ins_agreements", agr.id, {
                                  text: editAgreementText,
                                });
                                setEditingAgreementId(null);
                              }}
                              className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold"
                            >
                              Zapisz zmiany
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                            {agr.text}
                          </p>
                        )}
                      </div>
                    );
                  })}
            </div>
          )}

          {/* HARMONOGRAM / PLAN */}
          {activeTab === "harmonogram" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-slate-200/70 p-1.5 rounded-xl flex max-w-sm mx-auto print:hidden">
                {["month", "week", "day"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setCalendarView(m)}
                    className={`flex-1 py-2 text-xs uppercase font-bold rounded-lg transition ${
                      calendarView === m
                        ? "bg-slate-900 shadow text-amber-400"
                        : "text-slate-600"
                    }`}
                  >
                    {m === "month" ? "Miesiąc" : m === "week" ? "Tydzień" : "Dzień"}
                  </button>
                ))}
              </div>

              {isAdministrator && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 print:hidden">
                  <h3 className="text-xs uppercase font-bold text-slate-500 mb-2">
                    Filtruj brygady / wykonawców:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {usersList.map((u) => (
                      <label
                        key={u.id}
                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border cursor-pointer transition ${
                          visibleUsersInCalendar.includes(u.email)
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white border-slate-200 text-slate-600"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={visibleUsersInCalendar.includes(u.email)}
                          onChange={() => toggleVisibleUser(u.email)}
                          className="hidden"
                        />
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            u.color || "bg-slate-500"
                          }`}
                        ></span>
                        {u.displayName || u.email}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {canEditTab("harmonogram") && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 print:hidden border-t-4 border-t-emerald-500">
                  <div className="flex flex-col md:flex-row gap-3">
                    <input
                      type="date"
                      value={newTaskDate}
                      onChange={(e) => setNewTaskDate(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm md:w-44"
                    />
                    <input
                      type="text"
                      placeholder="Zaplanuj etap robót / dostawę / odbiór..."
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm"
                    />
                 <button
  onClick={() =>
    genericAdd(
      "ins_tasks",
      {
        date: newTaskDate,
        task: newTaskText,
        color: "bg-slate-800",
        isCompleted: false, // DODANO: Domyślny status
      },
      () => {
        setNewTaskDate("");
        setNewTaskText("");
      }
    )
  }
  disabled={!newTaskDate || !newTaskText.trim()}
  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition"
>
  Dodaj do planu
</button>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 print:border-none print:shadow-none print:p-0">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                  <button
                    onClick={() => moveDate(-1, calendarView)}
                    className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 print:hidden"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h3 className="font-black text-base uppercase tracking-wide">
                    {calendarView === "month" &&
                      currentCalDate.toLocaleDateString("pl-PL", {
                        month: "long",
                        year: "numeric",
                      })}
                    {calendarView === "week" &&
                      `Tydzień od ${getWeekDays(currentCalDate)[0].toLocaleDateString(
                        "pl-PL"
                      )}`}
                    {calendarView === "day" &&
                      currentCalDate.toLocaleDateString("pl-PL", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 print:hidden"
                      title="Drukuj Harmonogram"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => moveDate(1, calendarView)}
                      className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 print:hidden"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Widok: MIESIĄC */}
                {calendarView === "month" && (
                  <>
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2 uppercase">
                      <div>PN</div>
                      <div>WT</div>
                      <div>ŚR</div>
                      <div>CZ</div>
                      <div>PT</div>
                      <div>SB</div>
                      <div>ND</div>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                      {Array(
                        getFirstDayOfMonth(
                          currentCalDate.getFullYear(),
                          currentCalDate.getMonth()
                        )
                      )
                        .fill(null)
                        .concat(
                          Array.from(
                            {
                              length: getDaysInMonth(
                                currentCalDate.getFullYear(),
                                currentCalDate.getMonth()
                              ),
                            },
                            (_, i) => i + 1
                          )
                        )
                        .map((day, i) => {
                          if (day === null)
                            return (
                              <div
                                key={i}
                                className="min-h-[85px] bg-slate-50/50 rounded-lg"
                              ></div>
                            );
                          const dateStr = `${currentCalDate.getFullYear()}-${(
                            currentCalDate.getMonth() + 1
                          )
                            .toString()
                            .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

                          const dayItems = combinedCalendarItems.filter((item) => {
                            if (item.date !== dateStr) return false;
                            if (
                              isAdministrator &&
                              visibleUsersInCalendar.length > 0 &&
                              item.assignee &&
                              !visibleUsersInCalendar.includes(item.assignee)
                            )
                              return false;
                            return true;
                          });

                          return (
                            <div
                              key={i}
                              className={`min-h-[85px] border rounded-lg p-1.5 flex flex-col ${
                                dateStr === todayStr
                                  ? "border-amber-500 bg-amber-50/20"
                                  : dayItems.length > 0
                                  ? "bg-slate-50 border-slate-300"
                                  : "bg-white border-slate-100"
                              }`}
                            >
                              <span
                                className={`text-[11px] font-bold ${
                                  dateStr === todayStr
                                    ? "text-amber-600"
                                    : dayItems.length > 0
                                    ? "text-slate-800"
                                    : "text-slate-400"
                                }`}
                              >
                                {day}
                              </span>
                              <div className="flex-1 flex flex-col gap-1 mt-1 overflow-hidden">
                                {dayItems.map((item, idx) => {
                                  const taskLabel =
                                    item.type === "task"
                                      ? item.title
                                      : `${item.title} (${getShortUserName(
                                          item.assignee
                                        )})`;
                                  return (
                                    <div
  key={idx}
  className={`${item.color} text-white text-[10px] p-2 rounded-lg shadow-sm relative group ${item.raw?.isCompleted ? 'opacity-50 line-through' : ''}`}
>
  <span className="block break-words font-semibold">
    {taskLabel}
  </span>
  {canEditTab("harmonogram") && item.type === "task" && (
    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-1 bg-slate-900/80 p-1 rounded backdrop-blur-sm transition-opacity">
      <CheckCircle2
        className="w-3.5 h-3.5 cursor-pointer text-emerald-400 hover:text-emerald-300"
        onClick={(e) => {
          e.stopPropagation();
          genericUpdate("ins_tasks", item.id, { isCompleted: !item.raw.isCompleted });
        }}
        title="Zmień status"
      />
      <EditIcon
        className="w-3.5 h-3.5 cursor-pointer text-blue-400 hover:text-blue-300"
        onClick={(e) => {
          e.stopPropagation();
          const newText = prompt("Edytuj treść zadania:", item.raw.task);
          if (newText && newText.trim() !== "") {
            genericUpdate("ins_tasks", item.id, { task: newText.trim() });
          }
        }}
        title="Edytuj"
      />
      <Trash2
        className="w-3.5 h-3.5 cursor-pointer text-red-400 hover:text-red-300"
        onClick={(e) => {
          e.stopPropagation();
          genericDel("ins_tasks", item.id);
        }}
        title="Usuń"
      />
    </div>
  )}
</div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </>
                )}

                {/* Widok: TYDZIEŃ */}
                {calendarView === "week" && (
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                    {getWeekDays(currentCalDate).map((d, i) => {
                      const dateStr = `${d.getFullYear()}-${(d.getMonth() + 1)
                        .toString()
                        .padStart(2, "0")}-${d
                        .getDate()
                        .toString()
                        .padStart(2, "0")}`;

                      const dayItems = combinedCalendarItems.filter((item) => {
                        if (item.date !== dateStr) return false;
                        if (
                          isAdministrator &&
                          visibleUsersInCalendar.length > 0 &&
                          item.assignee &&
                          !visibleUsersInCalendar.includes(item.assignee)
                        )
                          return false;
                        return true;
                      });

                      return (
                        <div
                          key={i}
                          className="border rounded-xl min-h-[180px] flex flex-col bg-slate-50/40"
                        >
                          <div className="bg-slate-100 text-center py-2 border-b text-xs font-bold text-slate-700 uppercase rounded-t-xl">
                            {d.toLocaleDateString("pl-PL", { weekday: "short" })}{" "}
                            <span className="text-slate-500">{d.getDate()}</span>
                          </div>
                          <div className="p-2 space-y-1.5">
                            {dayItems.map((item, idx) => {
                              const taskLabel =
                                item.type === "task"
                                  ? item.title
                                  : `${item.title} (${getShortUserName(
                                      item.assignee
                                    )})`;
                              return (
                               <div
  key={idx}
  className={`${item.color} text-white text-[10px] p-2 rounded-lg shadow-sm relative group ${item.raw?.isCompleted ? 'opacity-50 line-through' : ''}`}
>
  <span className="block break-words font-semibold">
    {taskLabel}
  </span>
  {canEditTab("harmonogram") && item.type === "task" && (
    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-1 bg-slate-900/80 p-1 rounded backdrop-blur-sm transition-opacity">
      <CheckCircle2
        className="w-3.5 h-3.5 cursor-pointer text-emerald-400 hover:text-emerald-300"
        onClick={(e) => {
          e.stopPropagation();
          genericUpdate("ins_tasks", item.id, { isCompleted: !item.raw.isCompleted });
        }}
        title="Zmień status"
      />
      <EditIcon
        className="w-3.5 h-3.5 cursor-pointer text-blue-400 hover:text-blue-300"
        onClick={(e) => {
          e.stopPropagation();
          const newText = prompt("Edytuj treść zadania:", item.raw.task);
          if (newText && newText.trim() !== "") {
            genericUpdate("ins_tasks", item.id, { task: newText.trim() });
          }
        }}
        title="Edytuj"
      />
      <Trash2
        className="w-3.5 h-3.5 cursor-pointer text-red-400 hover:text-red-300"
        onClick={(e) => {
          e.stopPropagation();
          genericDel("ins_tasks", item.id);
        }}
        title="Usuń"
      />
    </div>
  )}
</div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Widok: DZIEŃ */}
                {calendarView === "day" &&
                  (() => {
                    const dateStr = `${currentCalDate.getFullYear()}-${(
                      currentCalDate.getMonth() + 1
                    )
                      .toString()
                      .padStart(2, "0")}-${currentCalDate
                      .getDate()
                      .toString()
                      .padStart(2, "0")}`;

                    const dayItems = combinedCalendarItems.filter((item) => {
                      if (item.date !== dateStr) return false;
                      if (
                        isAdministrator &&
                        visibleUsersInCalendar.length > 0 &&
                        item.assignee &&
                        !visibleUsersInCalendar.includes(item.assignee)
                      )
                        return false;
                      return true;
                    });

                    return (
                      <div className="space-y-3">
                        {dayItems.length === 0 && (
                          <p className="text-center text-slate-400 py-10">
                            Brak zaplanowanych zadań na ten dzień.
                          </p>
                        )}
                       {dayItems.map((item) => (
  <div key={item.id} className="flex items-center justify-between p-4 border rounded-xl bg-slate-50">
    <div className="flex items-center gap-3">
      <div className={`w-3.5 h-3.5 rounded-full ${item.color}`}></div>
      <div>
        <span className={`font-bold block text-sm ${item.raw?.isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
          {item.type === "task" ? item.raw.task : item.title}
        </span>
        {item.assignee && (
          <span className="text-xs text-slate-500">
            Wykonawca: {getShortUserName(item.assignee)}
          </span>
        )}
      </div>
    </div>
    {canEditTab("harmonogram") && item.type === "task" && (
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            genericUpdate("ins_tasks", item.id, { isCompleted: !item.raw.isCompleted });
          }}
          className="text-slate-400 hover:text-emerald-500 p-1 transition-colors"
          title="Zmień status"
        >
          {item.raw.isCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            const newText = prompt("Edytuj treść zadania:", item.raw.task);
            if (newText && newText.trim() !== "") {
              genericUpdate("ins_tasks", item.id, { task: newText.trim() });
            }
          }}
          className="text-slate-400 hover:text-blue-500 p-1 transition-colors"
          title="Edytuj"
        >
          <EditIcon className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            genericDel("ins_tasks", item.id);
          }}
          className="text-slate-400 hover:text-red-500 p-1 transition-colors"
          title="Usuń"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )}
  </div>
))}
                      </div>
                    );
                  })()}
              </div>
            </div>
          )}

          {/* FINANSE / KOSZTY */}
          {activeTab === "finanse" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center print:hidden">
                <h2 className="text-lg font-black text-slate-900">
                  Kontrola Kosztów i Rozliczeń Inwestycji
                </h2>
                <button
                  onClick={exportCostsToCSV}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
                >
                  <Download className="w-4 h-4" /> Eksportuj do Excela (CSV)
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                  <div className="text-[10px] text-slate-400 uppercase mb-1 font-bold">
                    Budżet Inwestycji
                  </div>
                  <div className="text-base font-black text-slate-900">
                    {formatCurrency(currentBudget)}
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                  <div className="text-[10px] text-slate-400 uppercase mb-1 font-bold">
                    Wpłacone transze
                  </div>
                  <div className="text-base font-black text-blue-600">
                    {formatCurrency(totalPaid)}
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                  <div className="text-[10px] text-slate-400 uppercase mb-1 font-bold">
                    Pozostało do wpłaty
                  </div>
                  <div className="text-base font-black text-amber-600">
                    {formatCurrency(remainingToSettle)}
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                  <div className="text-[10px] text-slate-400 uppercase mb-1 font-bold">
                    Poniesione Koszty
                  </div>
                  <div className="text-base font-black text-red-600">
                    {formatCurrency(currentTotalCosts)}
                  </div>
                </div>
                <div
                  className={`bg-white rounded-2xl shadow-sm border p-4 col-span-2 md:col-span-1 ${
                    currentProfit < 0
                      ? "border-b-4 border-b-red-500"
                      : "border-b-4 border-b-emerald-500"
                  }`}
                >
                  <div className="text-[10px] text-slate-400 uppercase mb-1 font-bold">
                    Bilans / Zysk
                  </div>
                  <div
                    className={`text-base font-black ${
                      currentProfit < 0 ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {formatCurrency(currentProfit)}
                  </div>
                </div>
              </div>

              {/* Transze */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-amber-500" /> Harmonogram Rzeczowo-Finansowy (Wpłaty Inwestora)
                </h3>
                {canEditTab("finanse") && (
                  <div className="flex flex-col md:flex-row gap-3 mb-4">
                    <input
                      type="text"
                      placeholder="Etap płatności (np. Transza II - Stan Surowy Otwarty)"
                      value={newInstTitle}
                      onChange={(e) => setNewInstTitle(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Kwota (PLN)"
                      value={newInstAmount}
                      onChange={(e) => setNewInstAmount(e.target.value)}
                      className="w-full md:w-40 bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm"
                    />
                    <button
                      onClick={() =>
                        genericAdd(
                          "ins_installments",
                          {
                            title: newInstTitle,
                            amount: parseFloat(newInstAmount) || 0,
                            isPaid: false,
                          },
                          () => {
                            setNewInstTitle("");
                            setNewInstAmount("");
                          }
                        )
                      }
                      disabled={!newInstTitle || !newInstAmount}
                      className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold px-5 py-2.5"
                    >
                      Dodaj transzę
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {projInstallments.length === 0 && (
                    <p className="text-center text-slate-400 py-4 text-sm">
                      Brak zdefiniowanych transz rozliczeniowych.
                    </p>
                  )}
                  {projInstallments.map((inst) => {
                    const isEditing = editingInstId === inst.id;
                    return (
                      <div
                        key={inst.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-3.5 border rounded-xl bg-slate-50 gap-3"
                      >
                        {isEditing ? (
                          <div className="flex-1 flex gap-2 w-full">
                            <input
                              type="text"
                              value={editInstTitle}
                              onChange={(e) => setEditInstTitle(e.target.value)}
                              className="flex-1 border rounded-lg p-1.5 text-sm"
                            />
                            <input
                              type="number"
                              value={editInstAmount}
                              onChange={(e) => setEditInstAmount(e.target.value)}
                              className="w-28 border rounded-lg p-1.5 text-sm"
                            />
                            <button
                              onClick={() => {
                                genericUpdate("ins_installments", inst.id, {
                                  title: editInstTitle,
                                  amount: parseFloat(editInstAmount) || 0,
                                });
                                setEditingInstId(null);
                              }}
                              className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                            >
                              Zapisz
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 flex-1">
                            <input
                              type="checkbox"
                              checked={inst.isPaid}
                              onChange={(e) => {
                                if (canEditTab("finanse")) {
                                  genericUpdate("ins_installments", inst.id, {
                                    isPaid: e.target.checked,
                                  });
                                }
                              }}
                              disabled={!canEditTab("finanse")}
                              className="w-5 h-5 rounded border-slate-300 text-emerald-600 cursor-pointer"
                            />
                            <span
                              className={`text-sm font-semibold ${
                                inst.isPaid
                                  ? "text-slate-400 line-through"
                                  : "text-slate-800"
                              }`}
                            >
                              {inst.title}
                            </span>
                            <span
                              className={`text-sm font-black ml-auto ${
                                inst.isPaid ? "text-emerald-600" : "text-slate-800"
                              }`}
                            >
                              {formatCurrency(inst.amount)}
                            </span>
                          </div>
                        )}
                        {canEditTab("finanse") && !isEditing && (
                          <div className="flex items-center gap-2 print:hidden">
                            <button
                              onClick={() => {
                                setEditingInstId(inst.id);
                                setEditInstTitle(inst.title);
                                setEditInstAmount(inst.amount);
                              }}
                              className="text-slate-400 hover:text-blue-600 p-1"
                            >
                              <EditIcon className="w-4 h-4" />
                            </button>
                            <Trash2
                              className="w-4 h-4 text-slate-300 cursor-pointer hover:text-red-500"
                              onClick={() => genericDel("ins_installments", inst.id)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {canEditTab("finanse") && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                  <h3 className="text-sm font-bold text-slate-800 mb-3">
                    Zaksięguj nowy koszt / fakturę kosztową
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                      type="date"
                      value={newCostDate}
                      onChange={(e) => setNewCostDate(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Kwota (PLN)"
                      value={newCostAmount}
                      onChange={(e) => setNewCostAmount(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm"
                    />
                    <select
                      value={newCostCategory}
                      onChange={(e) => setNewCostCategory(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm font-bold"
                    >
                      {COST_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Opis faktury / towaru / wykonawcy"
                      value={newCostDesc}
                      onChange={(e) => setNewCostDesc(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm"
                    />
                  </div>
                  <button
                    onClick={() =>
                      genericAdd(
                        "ins_costs",
                        {
                          date: newCostDate,
                          category: newCostCategory,
                          description: newCostDesc,
                          amount: parseFloat(newCostAmount),
                        },
                        () => {
                          setNewCostDate("");
                          setNewCostDesc("");
                          setNewCostAmount("");
                        }
                      )
                    }
                    disabled={!newCostDate || !newCostAmount || !newCostDesc}
                    className="w-full mt-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold p-3 shadow-sm transition"
                  >
                    Zapisz pozycję kosztową
                  </button>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-900 text-white text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3.5">Data</th>
                      <th className="px-4 py-3.5 hidden md:table-cell">Kategoria</th>
                      <th className="px-4 py-3.5">Opis pozycji</th>
                      <th className="px-4 py-3.5 text-right">Kwota</th>
                      <th className="px-4 py-3.5 text-center print:hidden">Akcje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {projCosts.map((cost) => {
                      const isEditing = editingCostId === cost.id;
                      return (
                        <tr key={cost.id} className="hover:bg-slate-50">
                          {isEditing ? (
                            <td colSpan="5" className="p-3 bg-slate-50">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                <input
                                  type="text"
                                  value={editCostDesc}
                                  onChange={(e) => setEditCostDesc(e.target.value)}
                                  className="border rounded-lg p-1.5 text-xs"
                                />
                                <input
                                  type="number"
                                  value={editCostAmount}
                                  onChange={(e) => setEditCostAmount(e.target.value)}
                                  className="border rounded-lg p-1.5 text-xs"
                                />
                                <select
                                  value={editCostCategory}
                                  onChange={(e) => setEditCostCategory(e.target.value)}
                                  className="border rounded-lg p-1.5 text-xs"
                                >
                                  {COST_CATEGORIES.map((c) => (
                                    <option key={c} value={c}>
                                      {c}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => {
                                    genericUpdate("ins_costs", cost.id, {
                                      description: editCostDesc,
                                      amount: parseFloat(editCostAmount) || 0,
                                      category: editCostCategory,
                                    });
                                    setEditingCostId(null);
                                  }}
                                  className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                                >
                                  Zapisz
                                </button>
                              </div>
                            </td>
                          ) : (
                            <>
                              <td className="px-4 py-3 font-mono text-xs text-slate-500">
                                {cost.date}
                              </td>
                              <td className="px-4 py-3 text-xs font-bold text-slate-600 hidden md:table-cell">
                                <span className="bg-slate-100 px-2.5 py-1 rounded-md">
                                  {cost.category}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-medium text-slate-800">
                                {cost.description}
                              </td>
                              <td className="px-4 py-3 text-right font-black text-red-600">
                                {formatCurrency(cost.amount)}
                              </td>
                              <td className="px-4 py-3 text-center print:hidden">
                                {canEditTab("finanse") && (
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingCostId(cost.id);
                                        setEditCostDesc(cost.description || "");
                                        setEditCostAmount(cost.amount || "");
                                        setEditCostCategory(
                                          cost.category || "Materiały"
                                        );
                                      }}
                                      className="text-slate-400 hover:text-blue-600 p-1"
                                    >
                                      <EditIcon className="w-4 h-4" />
                                    </button>
                                    <Trash2
                                      className="w-4 h-4 text-slate-300 cursor-pointer hover:text-red-500"
                                      onClick={() => genericDel("ins_costs", cost.id)}
                                    />
                                  </div>
                                )}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CHECKLISTY / ODBIORY */}
          {activeTab === "checklisty" && (
            <div className="space-y-6 animate-in fade-in">
              {canEditTab("checklisty") && (
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 print:hidden">
                  <div className="flex gap-2 flex-1">
                    <input
                      type="text"
                      placeholder="Nowa kategoria odbiorowa..."
                      value={newCategoryTitleInput}
                      onChange={(e) => setNewCategoryTitleInput(e.target.value)}
                      className="border border-slate-300 rounded-xl p-2.5 text-sm flex-1"
                    />
                    <button
                      onClick={handleAddCategory}
                      className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Dodaj etap
                    </button>
                  </div>
                  <button
                    onClick={() => setIsEditingChecklist(!isEditingChecklist)}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition ${
                      isEditingChecklist
                        ? "bg-amber-500 text-slate-950 border-amber-500"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    <SettingsIco className="w-4 h-4" />
                    {isEditingChecklist ? "Zakończ Edycję Szablonu" : "Modyfikuj Punkty Kontrolne"}
                  </button>
                </div>
              )}

              {Object.entries(currentChecklistTemplate).map(([stage, items]) => {
                const checked = (items || []).filter(
                  (_, i) => currentCState[`${stage}_${i}`]
                ).length;
                const prog = Math.round(
                  (checked / ((items || []).length || 1)) * 100
                );
                return (
                  <div
                    key={stage}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                  >
                    <div className="bg-slate-900 text-white p-4">
                      <div className="flex justify-between items-center mb-2">
                        {isEditingChecklist && editingStageName === stage ? (
                          <div className="flex items-center gap-2 flex-1 mr-4">
                            <input
                              type="text"
                              value={newStageNameInput}
                              onChange={(e) => setNewStageNameInput(e.target.value)}
                              className="border rounded-lg px-2.5 py-1 text-sm font-bold flex-1 bg-white text-slate-900"
                            />
                            <button
                              onClick={() => handleRenameStage(stage)}
                              className="bg-emerald-500 text-white px-3 py-1 rounded-lg text-xs font-bold"
                            >
                              Zapisz
                            </button>
                            <button
                              onClick={() => setEditingStageName(null)}
                              className="bg-slate-700 text-white px-3 py-1 rounded-lg text-xs"
                            >
                              Anuluj
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm tracking-wide">
                              {stage}
                            </span>
                            {isEditingChecklist && (
                              <button
                                onClick={() => {
                                  setEditingStageName(stage);
                                  setNewStageNameInput(stage);
                                }}
                                className="text-amber-400 hover:text-amber-300 p-1"
                              >
                                <EditIcon className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                        <span className="text-xs bg-slate-800 text-amber-400 px-2.5 py-1 rounded-full font-black">
                          {checked}/{(items || []).length} ({prog}%)
                        </span>
                      </div>
                      <div className="bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${prog}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {(items || []).map((item, i) => {
                        const isChecked = !!currentCState[`${stage}_${i}`];
                        return (
                          <div
                            key={i}
                            className={`p-4 flex items-start gap-3.5 hover:bg-slate-50 cursor-pointer relative transition ${
                              isChecked ? "bg-emerald-50/20" : ""
                            }`}
                            onClick={async () => {
                              if (isEditingChecklist || !canEditTab("checklisty"))
                                return;
                              const up = {
                                ...currentCState,
                                [`${stage}_${i}`]: !currentCState[`${stage}_${i}`],
                              };
                              await setDoc(
                                doc(
                                  db,
                                  "artifacts",
                                  appId,
                                  "public",
                                  "data",
                                  "ins_checklists",
                                  activeProjectId
                                ),
                                { projectId: activeProjectId, items: up },
                                { merge: true }
                              );
                            }}
                          >
                            <div className="mt-0.5">
                              {isChecked ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                              ) : (
                                <Circle className="w-5 h-5 text-slate-300" />
                              )}
                            </div>
                            <span
                              className={`text-sm font-medium ${
                                isChecked
                                  ? "text-slate-400 line-through"
                                  : "text-slate-800"
                              } flex-1 pr-8`}
                            >
                              {item}
                            </span>
                            {isEditingChecklist && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updated = { ...currentChecklistTemplate };
                                  updated[stage] = updated[stage].filter(
                                    (_, idx) => idx !== i
                                  );
                                  saveChecklistTemplate(updated);
                                }}
                                className="absolute right-4 top-4 text-red-400 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {isEditingChecklist && (
                        <div className="p-3 bg-slate-50 border-t flex gap-2">
                          <input
                            type="text"
                            placeholder="Dodaj nowy punkt kontrolny do tego etapu..."
                            value={
                              newChecklistItemStage === stage
                                ? newChecklistItemText
                                : ""
                            }
                            onChange={(e) => {
                              setNewChecklistItemStage(stage);
                              setNewChecklistItemText(e.target.value);
                            }}
                            className="flex-1 text-sm p-2 border rounded-xl bg-white"
                          />
                          <button
                            onClick={() => {
                              if (
                                !newChecklistItemText.trim() ||
                                newChecklistItemStage !== stage
                              )
                                return;
                              const updated = { ...currentChecklistTemplate };
                              if (!updated[stage]) updated[stage] = [];
                              updated[stage] = [
                                ...updated[stage],
                                newChecklistItemText.trim(),
                              ];
                              saveChecklistTemplate(updated);
                              setNewChecklistItemText("");
                              setNewChecklistItemStage(null);
                            }}
                            className="bg-slate-900 text-white px-4 rounded-xl text-xs font-bold"
                          >
                            Dodaj punkt
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* DOKUMENTACJA PROJEKTOWA */}
          {activeTab === "dokumenty" && (
            <div className="space-y-6 animate-in fade-in">
              {canEditTab("dokumenty") && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 border-t-4 border-t-blue-600 print:hidden">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 mb-4">
                    <FolderOpen className="w-5 h-5 text-blue-600" /> Wgraj dokument do repozytorium budowy
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Nazwa pliku (np. Rzut parteru, Protokół kominiarski)"
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      className="bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-sm md:col-span-2"
                    />
                    <select
                      value={newDocCategory}
                      onChange={(e) => setNewDocCategory(e.target.value)}
                      className="bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-sm font-bold"
                    >
                      <option value="Projekt / Rysunek">Projekt / Rysunek</option>
                      <option value="Protokół odbioru">Protokół odbioru</option>
                      <option value="Umowa / Aneks">Umowa / Aneks</option>
                      <option value="Certyfikat / DWU">Certyfikat / DWU</option>
                      <option value="Inne">Inne</option>
                    </select>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    ref={docInputRef}
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        if (!newDocName.trim()) {
                          alert("Wpisz najpierw nazwę dokumentu.");
                          if (docInputRef.current) docInputRef.current.value = "";
                          return;
                        }
                        setIsDocUploading(true);
                        loadDocumentAsBase64(e.target.files[0], (b64) => {
                          if (b64) {
                            genericAdd(
                              "ins_documents",
                              {
                                name: newDocName,
                                category: newDocCategory,
                                fileBase64: b64,
                                dateString: new Date().toLocaleDateString("pl-PL"),
                              },
                              () => {
                                setIsDocUploading(false);
                                setNewDocName("");
                                if (docInputRef.current) docInputRef.current.value = "";
                              }
                            );
                          } else {
                            setIsDocUploading(false);
                            if (docInputRef.current) docInputRef.current.value = "";
                          }
                        });
                      }
                    }}
                  />
                  <button
                    onClick={() => docInputRef.current?.click()}
                    disabled={isDocUploading || !newDocName.trim()}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl text-sm font-bold inline-flex items-center justify-center gap-2 w-full disabled:opacity-50 transition"
                  >
                    {isDocUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Zapisywanie dokumentu...
                      </>
                    ) : (
                      <>
                        <FileUp className="w-4 h-4" /> Wybierz plik z dysku i zapisz (PDF, JPG, PNG, DOCX - maks. 750 KB)
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projDocuments.length === 0 && (
                  <div className="bg-white rounded-2xl border p-10 text-center text-slate-400 col-span-full">
                    Brak wgranych dokumentów technicznych.
                  </div>
                )}
                {projDocuments.map((docItem) => (
                  <div
                    key={docItem.id}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex items-center gap-4 hover:border-slate-400 transition"
                  >
                    <div className="bg-blue-50 p-3.5 rounded-xl text-blue-600">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {docItem.category || "Dokument"}
                      </span>
                      <h4
                        className="font-bold text-slate-900 text-sm truncate mt-1"
                        title={docItem.name}
                      >
                        {docItem.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Dodano: {docItem.dateString}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={docItem.fileBase64}
                        download={docItem.name}
                        className="bg-slate-100 p-2.5 rounded-xl text-slate-700 hover:bg-amber-500 hover:text-slate-950 transition"
                        title="Pobierz plik"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      {canEditTab("dokumenty") && (
                        <button
                          onClick={() => genericDel("ins_documents", docItem.id)}
                          className="bg-red-50 p-2.5 rounded-xl text-red-500 hover:bg-red-100 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* USTERKI / PUNCH-LIST (Z PRIORYTETEM, LOKALIZACJĄ I FILTREM) */}
          {activeTab === "usterki" && (
            <div className="space-y-6 animate-in fade-in">
              {canEditTab("usterki") && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 border-t-4 border-t-red-600 print:hidden">
                  <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
                    <AlertOctagon className="w-5 h-5 text-red-600" /> Zgłoś usterkę odbiorową / niezgodność (Punch-list)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Co wymaga poprawy? (np. Odchyłka pionu ściany działowej)"
                      value={newIssueTitle}
                      onChange={(e) => setNewIssueTitle(e.target.value)}
                      className="border border-slate-300 rounded-xl p-2.5 text-sm bg-slate-50"
                    />
                    <input
                      type="text"
                      placeholder="Lokalizacja / Pomieszczenie (np. Budynek A, Piętro, Łazienka)"
                      value={newIssueLocation}
                      onChange={(e) => setNewIssueLocation(e.target.value)}
                      className="border border-slate-300 rounded-xl p-2.5 text-sm bg-slate-50"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <select
                      value={newIssuePriority}
                      onChange={(e) => setNewIssuePriority(e.target.value)}
                      className="border border-slate-300 rounded-xl p-2.5 text-sm bg-slate-50 font-bold"
                    >
                      <option value="Krytyczna">Priorytet: KRYTYCZNA (wstrzymuje dalsze prace)</option>
                      <option value="Ważna">Priorytet: WAŻNA (do usunięcia przed odbiorem)</option>
                      <option value="Kosmetyczna">Priorytet: KOSMETYCZNA</option>
                    </select>
                    <select
                      value={newIssueAssignee}
                      onChange={(e) => setNewIssueAssignee(e.target.value)}
                      className="border border-slate-300 rounded-xl p-2.5 text-sm bg-slate-50 font-bold"
                    >
                      <option value="">Przypisz wykonawcę odpowiedzialnego...</option>
                      {usersList
                        .filter((u) => u.role === "wykonawca" || u.role === "pracownik")
                        .map((u) => (
                          <option key={u.id} value={u.email}>
                            {u.displayName || u.email}
                          </option>
                        ))}
                    </select>
                  </div>
                  <textarea
                    placeholder="Szczegółowy opis techniczny usterki oraz wymagany sposób naprawy..."
                    value={newIssueDesc}
                    onChange={(e) => setNewIssueDesc(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm bg-slate-50 min-h-[70px] mb-3"
                  />

                  {newIssuePhoto && (
                    <div className="mb-3 relative inline-block">
                      <img
                        src={newIssuePhoto}
                        alt="Usterka"
                        className="h-24 rounded-xl object-cover border"
                      />
                      <button
                        onClick={() => setNewIssuePhoto(null)}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={issuePhotoRef}
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          compressImage(e.target.files[0], (b64) => {
                            if (b64) setNewIssuePhoto(b64);
                            if (issuePhotoRef.current) issuePhotoRef.current.value = "";
                          });
                        }
                      }}
                    />
                    <button
                      onClick={() => issuePhotoRef.current?.click()}
                      className="text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold flex gap-2 items-center transition"
                    >
                      <Camera className="w-4 h-4" /> Dodaj zdjęcie usterki
                    </button>
                    <button
                      onClick={() => {
                        if (!newIssueTitle.trim()) return;
                        genericAdd(
                          "ins_issues",
                          {
                            title: newIssueTitle,
                            location: newIssueLocation,
                            priority: newIssuePriority,
                            description: newIssueDesc,
                            assignee: newIssueAssignee,
                            reporter: user.email,
                            status: "Zgłoszona",
                            photoBase64: newIssuePhoto,
                            dateString: new Date().toLocaleString("pl-PL"),
                            notes: "",
                          },
                          () => {
                            setNewIssueTitle("");
                            setNewIssueLocation("");
                            setNewIssueDesc("");
                            setNewIssueAssignee("");
                            setNewIssuePhoto(null);
                          }
                        );
                      }}
                      disabled={!newIssueTitle.trim()}
                      className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition"
                    >
                      Zarejestruj usterkę
                    </button>
                  </div>
                </div>
              )}

              {/* FILTR USTEREK */}
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <Filter className="w-4 h-4" /> Widok listy:
                </span>
                <div className="flex gap-1.5">
                  {[
                    { id: "otwarte", label: "Otwarte / Do weryfikacji" },
                    { id: "zamkniete", label: "Odebrane (Zaakceptowane)" },
                    { id: "wszystkie", label: "Wszystkie" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setIssueFilter(f.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        issueFilter === f.id
                          ? "bg-slate-900 text-amber-400"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {projIssues
                  .filter((iss) => {
                    if (issueFilter === "otwarte")
                      return iss.status !== "Zaakceptowana";
                    if (issueFilter === "zamkniete")
                      return iss.status === "Zaakceptowana";
                    return true;
                  })
                  .map((iss) => {
                    const isEditing = editingIssueId === iss.id;
                    const iAmAssignee = iss.assignee === user.email;
                    const canManageIssue =
                      isAdministrator || iss.reporter === user.email;

                    return (
                      <div
                        key={iss.id}
                        className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-5 relative border-l-4 flex flex-col md:flex-row gap-4 ${
                          iss.status === "Zaakceptowana"
                            ? "border-l-emerald-500 opacity-80"
                            : iss.priority === "Krytyczna"
                            ? "border-l-red-600"
                            : "border-l-amber-500"
                        }`}
                      >
                        {iss.photoBase64 && (
                          <div className="w-full md:w-36 h-36 flex-shrink-0">
                            <img
                              src={iss.photoBase64}
                              alt="Usterka"
                              onClick={() =>
                                setLightboxImage({
                                  src: iss.photoBase64,
                                  caption: iss.title,
                                  date: iss.dateString,
                                })
                              }
                              className="w-full h-full object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-90"
                            />
                          </div>
                        )}

                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                <span
                                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                    iss.priority === "Krytyczna"
                                      ? "bg-red-600 text-white"
                                      : iss.priority === "Kosmetyczna"
                                      ? "bg-slate-200 text-slate-700"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {iss.priority || "Ważna"}
                                </span>
                                {iss.location && (
                                  <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                    📍 {iss.location}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-base text-slate-900">
                                {iss.title}
                              </h4>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Zgłoszono: {iss.dateString}{" "}
                                {iss.assignee &&
                                  `| Wykonawca: ${getShortUserName(iss.assignee)}`}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                iss.status === "Zaakceptowana"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : iss.status === "Naprawiona"
                                  ? "bg-blue-100 text-blue-800"
                                  : iss.status === "W trakcie"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {iss.status}
                            </span>
                          </div>

                          {iss.description && (
                            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                              {iss.description}
                            </p>
                          )}

                          {iss.notes && (
                            <div className="text-xs text-slate-600 border-l-2 border-amber-400 pl-3 py-1 bg-amber-50/40 rounded-r-lg">
                              <strong>Komentarz:</strong> {iss.notes}
                            </div>
                          )}

                          {canEditTab("usterki") && (
                            <div className="pt-2 border-t flex flex-wrap items-center gap-2 print:hidden mt-2">
                              {isEditing ? (
                                <div className="w-full flex flex-col sm:flex-row gap-2">
                                  <select
                                    value={editIssueStatus}
                                    onChange={(e) => setEditIssueStatus(e.target.value)}
                                    className="border rounded-lg p-2 text-xs font-bold bg-slate-50"
                                  >
                                    <option value="Zgłoszona">Zgłoszona</option>
                                    <option value="W trakcie">W trakcie usuwania</option>
                                    <option value="Naprawiona">Zgłoszona do odbioru (Naprawiona)</option>
                                    {canManageIssue && (
                                      <option value="Zaakceptowana">Zaakceptowana przez Nadzór</option>
                                    )}
                                  </select>
                                  <input
                                    type="text"
                                    placeholder="Dodaj uwagę / protokół naprawy..."
                                    value={editIssueNote}
                                    onChange={(e) => setEditIssueNote(e.target.value)}
                                    className="border rounded-lg p-2 text-xs flex-1 bg-slate-50"
                                  />
                                  <button
                                    onClick={() => {
                                      genericUpdate("ins_issues", iss.id, {
                                        status: editIssueStatus,
                                        notes: editIssueNote,
                                      });
                                      setEditingIssueId(null);
                                    }}
                                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold"
                                  >
                                    Zapisz
                                  </button>
                                  <button
                                    onClick={() => setEditingIssueId(null)}
                                    className="bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-bold"
                                  >
                                    Anuluj
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingIssueId(iss.id);
                                      setEditIssueStatus(iss.status);
                                      setEditIssueNote(iss.notes || "");
                                    }}
                                    className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                                  >
                                    <EditIcon className="w-3.5 h-3.5" /> Zmień status / Dodaj notatkę
                                  </button>
                                  {iAmAssignee &&
                                    iss.status !== "Naprawiona" &&
                                    iss.status !== "Zaakceptowana" && (
                                      <button
                                        onClick={() =>
                                          genericUpdate("ins_issues", iss.id, {
                                            status: "Naprawiona",
                                          })
                                        }
                                        className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition"
                                      >
                                        Zgłoś wykonanie naprawy
                                      </button>
                                    )}
                                  {canManageIssue && iss.status === "Naprawiona" && (
                                    <button
                                      onClick={() =>
                                        genericUpdate("ins_issues", iss.id, {
                                          status: "Zaakceptowana",
                                        })
                                      }
                                      className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-lg transition flex items-center gap-1"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" /> Potwierdź usunięcie usterki
                                    </button>
                                  )}
                                  {canManageIssue && (
                                    <button
                                      onClick={() => genericDel("ins_issues", iss.id)}
                                      className="ml-auto text-slate-300 hover:text-red-500 p-1"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* FOTORELACJA / ZDJĘCIA Z LIGHTBOXEM */}
          {activeTab === "zdjecia" && (
            <div className="space-y-6 animate-in fade-in">
              {canEditTab("zdjecia") && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row gap-3 items-center print:hidden">
                  <input
                    type="text"
                    placeholder="Opis zdjęcia (np. Zbrojenie wieńca przed zalaniem)..."
                    value={photoDesc}
                    onChange={(e) => setPhotoDesc(e.target.value)}
                    className="bg-slate-50 border border-slate-300 p-3 rounded-xl text-sm flex-1 w-full"
                  />

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        setIsUploading(true);
                        compressImage(e.target.files[0], (b64) => {
                          if (b64) {
                            genericAdd(
                              "ins_photos",
                              {
                                imageBase64: b64,
                                dateString: new Date().toLocaleString("pl-PL"),
                                description: photoDesc,
                              },
                              () => {
                                setIsUploading(false);
                                setPhotoDesc("");
                                if (fileInputRef.current)
                                  fileInputRef.current.value = "";
                              }
                            );
                          } else {
                            setIsUploading(false);
                            if (fileInputRef.current)
                              fileInputRef.current.value = "";
                          }
                        });
                      }
                    }}
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl text-sm font-bold inline-flex items-center justify-center gap-2 w-full sm:w-auto whitespace-nowrap transition"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Kompresja...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 text-amber-400" /> Dodaj Zdjęcie
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos
                  .filter((p) => p.projectId === activeProjectId)
                  .map((photo) => (
                    <div
                      key={photo.id}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm relative group"
                    >
                      <div
                        className="aspect-[4/3] relative cursor-pointer overflow-hidden"
                        onClick={() =>
                          setLightboxImage({
                            src: photo.imageBase64,
                            caption: photo.description,
                            date: photo.dateString,
                          })
                        }
                      >
                        <img
                          src={photo.imageBase64}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          alt="Dokumentacja"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                          <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition drop-shadow" />
                        </div>
                      </div>
                      {canEditTab("zdjecia") && (
                        <button
                          onClick={() => genericDel("ins_photos", photo.id)}
                          className="absolute top-2.5 right-2.5 bg-red-600/90 hover:bg-red-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition print:hidden"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <div className="p-3 bg-white border-t">
                        <div className="text-[10px] font-mono text-slate-400 font-bold">
                          {photo.dateString}
                        </div>
                        {photo.description && (
                          <div className="text-xs font-medium text-slate-700 mt-0.5 line-clamp-2">
                            {photo.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* POLECENIA / ZADANIA DELEGOWANE (CZYSTY STAN REACT) */}
          {activeTab === "zadania" && (
            <div className="space-y-6 animate-in fade-in">
              {canEditTab("zadania") && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 border-t-4 border-t-indigo-600 print:hidden">
                  <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-indigo-600" /> Wydaj polecenie wykonawcze / deleguj zadanie
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Tytuł zadania"
                      value={newDelegationTitle}
                      onChange={(e) => setNewDelegationTitle(e.target.value)}
                      className="border border-slate-300 rounded-xl p-2.5 text-sm bg-slate-50"
                    />
                    <select
                      value={newDelegationAssignee}
                      onChange={(e) => setNewDelegationAssignee(e.target.value)}
                      className="border border-slate-300 rounded-xl p-2.5 text-sm bg-slate-50 font-bold"
                    >
                      <option value="">Wybierz adresata polecenia...</option>
                      {usersList
                        .filter(
                          (u) =>
                            u.role !== "inwestor" &&
                            u.role !== "przedstawiciel inwestora" &&
                            u.email !== user.email
                        )
                        .map((u) => (
                          <option key={u.id} value={u.email}>
                            {u.displayName || u.email} ({u.role})
                          </option>
                        ))}
                    </select>
                    <input
                      type="date"
                      value={newDelegationDeadline}
                      onChange={(e) => setNewDelegationDeadline(e.target.value)}
                      className="border border-slate-300 rounded-xl p-2.5 text-sm bg-slate-50"
                    />
                  </div>
                  <textarea
                    placeholder="Dokładny opis polecenia, wytyczne techniczne..."
                    value={newDelegationDesc}
                    onChange={(e) => setNewDelegationDesc(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm bg-slate-50 min-h-[70px] mb-3"
                  />
                  <button
                    onClick={() => {
                      if (!newDelegationTitle.trim() || !newDelegationAssignee)
                        return;
                      genericAdd(
                        "ins_delegations",
                        {
                          title: newDelegationTitle,
                          description: newDelegationDesc,
                          assignee: newDelegationAssignee,
                          assigner: user.email,
                          deadline: newDelegationDeadline,
                          status: "Do wykonania",
                          workerNote: "",
                          adminNote: "",
                        },
                        () => {
                          setNewDelegationTitle("");
                          setNewDelegationDesc("");
                          setNewDelegationAssignee("");
                          setNewDelegationDeadline("");
                        }
                      );
                    }}
                    disabled={!newDelegationTitle.trim() || !newDelegationAssignee}
                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold shadow-sm transition"
                  >
                    Przekaż zadanie do realizacji
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {projDelegations.length === 0 && (
                  <div className="bg-white rounded-2xl border p-10 text-center text-slate-400">
                    Brak wydanych poleceń dla tego projektu.
                  </div>
                )}
                {projDelegations.map((del) => {
                  const isAssignedToMe = del.assignee === user.email;
                  const canManageDelegation =
                    isAdministrator || del.assigner === user.email;
                  const workerDraft =
                    delegationNotesDraft[`w_${del.id}`] ?? (del.workerNote || "");
                  const adminDraft =
                    delegationNotesDraft[`a_${del.id}`] ?? (del.adminNote || "");

                  return (
                    <div
                      key={del.id}
                      className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 relative border-l-4 border-l-indigo-600 space-y-3"
                    >
                      {canManageDelegation && (
                        <button
                          onClick={() => genericDel("ins_delegations", del.id)}
                          className="absolute top-4 right-4 text-slate-300 hover:text-red-500 print:hidden"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      <div className="flex justify-between items-start pr-8">
                        <div>
                          <h4 className="font-bold text-base text-slate-900">
                            {del.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Wykonawca:{" "}
                            <strong className="text-slate-800">
                              {getShortUserName(del.assignee)}
                            </strong>{" "}
                            • Zlecił: {getShortUserName(del.assigner)}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            del.status === "Zatwierdzone"
                              ? "bg-emerald-100 text-emerald-800"
                              : del.status === "Wykonane"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {del.status}
                        </span>
                      </div>

                      {del.description && (
                        <p className="text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                          {del.description}
                        </p>
                      )}
                      {del.deadline && (
                        <p className="text-xs font-mono font-bold text-slate-600">
                          Termin realizacji: {del.deadline}
                        </p>
                      )}

                      {del.workerNote && (
                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900">
                          <strong>Raport wykonawcy:</strong> {del.workerNote}
                        </div>
                      )}

                      {del.adminNote && (
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs text-blue-900">
                          <strong>Uwaga nadzoru:</strong> {del.adminNote}
                        </div>
                      )}

                      {isAssignedToMe && del.status !== "Zatwierdzone" && (
                        <div className="pt-3 border-t space-y-2 print:hidden">
                          <input
                            type="text"
                            placeholder="Wpisz informację zwrotną dla nadzoru..."
                            value={workerDraft}
                            onChange={(e) =>
                              setDelegationNotesDraft({
                                ...delegationNotesDraft,
                                [`w_${del.id}`]: e.target.value,
                              })
                            }
                            className="border rounded-xl p-2.5 text-xs w-full bg-slate-50"
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() =>
                                genericUpdate("ins_delegations", del.id, {
                                  workerNote: workerDraft,
                                })
                              }
                              className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-xl text-xs font-bold transition"
                            >
                              Zapisz notatkę
                            </button>

                            {del.status !== "Wykonane" && (
                              <button
                                onClick={() =>
                                  genericUpdate("ins_delegations", del.id, {
                                    status: "Wykonane",
                                    workerNote: workerDraft,
                                  })
                                }
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition"
                              >
                                Zgłoś wykonanie zadania
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {canManageDelegation && (
                        <div className="pt-3 border-t space-y-2 print:hidden">
                          <input
                            type="text"
                            placeholder="Wpisz odpowiedź nadzoru..."
                            value={adminDraft}
                            onChange={(e) =>
                              setDelegationNotesDraft({
                                ...delegationNotesDraft,
                                [`a_${del.id}`]: e.target.value,
                              })
                            }
                            className="border rounded-xl p-2.5 text-xs w-full bg-slate-50"
                          />
                          <div className="flex flex-wrap justify-between gap-2">
                            <button
                              onClick={() =>
                                genericUpdate("ins_delegations", del.id, {
                                  adminNote: adminDraft,
                                })
                              }
                              className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-xl text-xs font-bold transition"
                            >
                              Zapisz odpowiedź nadzoru
                            </button>

                            {del.status === "Wykonane" && (
                              <button
                                onClick={() =>
                                  genericUpdate("ins_delegations", del.id, {
                                    status: "Zatwierdzone",
                                  })
                                }
                                className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Zatwierdź i zamknij zadanie
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* GENERATOR RAPORTÓW PDF */}
          {activeTab === "raporty" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 border-t-4 border-t-slate-900 print:hidden">
                <div className="text-center max-w-md mx-auto mb-6">
                  <div className="bg-amber-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-8 h-8 text-amber-500" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">
                    Generator Raportów Inwestorskich (PDF / A4)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Skonfiguruj zakres czasowy oraz sekcje, które mają znaleźć się w oficjalnym raporcie dla Inwestora.
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
                  {[
                    { id: "tydzien", label: "Bieżący Tydzień" },
                    { id: "miesiac", label: "Bieżący Miesiąc" },
                    { id: "kwartal", label: "Bieżący Kwartał" },
                    { id: "rok", label: "Cały Rok" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setReportPeriod(p.id)}
                      className={`py-2.5 text-xs font-bold rounded-xl border uppercase transition ${
                        reportPeriod === p.id
                          ? "bg-slate-900 border-slate-900 text-amber-400 shadow-sm"
                          : "bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 items-center justify-center mb-6 bg-slate-50 p-3 rounded-xl border">
                  <span className="text-xs font-bold text-slate-500 uppercase">
                    Przedział własny:
                  </span>
                  <input
                    type="date"
                    value={reportDateFrom}
                    onChange={(e) => {
                      setReportDateFrom(e.target.value);
                      setReportPeriod("custom");
                    }}
                    className="border rounded-lg p-1.5 text-xs bg-white"
                  />
                  <span className="text-xs font-bold">do</span>
                  <input
                    type="date"
                    value={reportDateTo}
                    onChange={(e) => {
                      setReportDateTo(e.target.value);
                      setReportPeriod("custom");
                    }}
                    className="border rounded-lg p-1.5 text-xs bg-white"
                  />
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { id: "logs", label: "Wpisy z Dziennika Przebiegu Robót (z pogodą)" },
                    { id: "issues", label: "Rejestr Usterek (Punch-list)" },
                    { id: "agreementsInwestor", label: "Ustalenia z Inwestorem" },
                    { id: "agreementsBudowa", label: "Ustalenia Wykonawcze na Budowie" },
                    { id: "agreementsRada", label: "Protokoły z Rad Budowy" },
                    { id: "budget", label: "Zestawienie Finansowe i Transze" },
                    { id: "checklists", label: "Odebrane Etapy i Punkty Kontrolne" },
                    { id: "photos", label: "Dokumentacja Fotograficzna" },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white transition"
                    >
                      <input
                        type="checkbox"
                        checked={reportConfig[opt.id]}
                        onChange={() =>
                          setReportConfig({
                            ...reportConfig,
                            [opt.id]: !reportConfig[opt.id],
                          })
                        }
                        className="w-4 h-4 text-amber-600 rounded border-slate-300"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>

                <button
                  onClick={() => setShowReportPreview(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-8 py-3.5 rounded-xl font-black uppercase tracking-wider w-full shadow-lg transition"
                >
                  Generuj Podgląd Raportu A4 (PDF)
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {renderProjectModal()}
      {renderLightbox()}
    </div>
  );
}
