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
} from "lucide-react";

import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithCustomToken,
  signInAnonymously,
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
// INICJALIZACJA FIREBASE
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
    "Odbiór zbrojenia: średnice, strzemiona, ciągłość",
    "Weryfikacja rzędnych posadowienia i przepustów",
    "Izolacje: ciągłość, grubość, rodzaj",
    "Odbiór drenażu opaskowego",
  ],
  "Stan Surowy Otwarty (SSO)": [
    "Weryfikacja pionów ścian i kątów",
    "Odbiór zbrojenia nadproży, słupów i podciągów",
    "Strop i wieńce: układ zbrojenia",
    "Kontrola wymiarów otworów okiennych",
    "Drożność przewodów kominowych",
    "Więźba: przekroje, oparcie, rozstaw",
  ],
  "Stan Surowy Zamknięty (SSZ)": [
    "Montaż stolarki okiennej (weryfikacja szczelności, taśmy)",
    "Montaż bramy garażowej",
    "Zamknięcie dachu (pokrycie, obróbki blacharskie)",
    "Wstępne uporządkowanie placu",
  ],
  "Instalacje Wewnętrzne": [
    "Weryfikacja tras prowadzenia (brak niebezpiecznych bruzd)",
    "Próba ciśnieniowa instalacji wodnej",
    "Ogrzewanie podłogowe: rozstaw, dylatacje, styropian",
    "Test drożności kanalizacji i spadki",
    "Pomiary rezystancji izolacji kabli",
  ],
  "Tynki i Wylewki": [
    "Weryfikacja podłoża pod tynki (gruntowanie)",
    "Odbiór pionów i kątów otynkowanych ścian",
    "Kontrola grubości i poziomu wylewek (dylatacje obw.)",
    "Pomiary wilgotności wylewek po dojrzewaniu",
  ],
  "Stan Deweloperski": [
    "Zakończenie prac elewacyjnych (ocieplenie, siatka, tynk)",
    "Montaż osprzętu elektrycznego (gniazdka, włączniki)",
    "Uruchomienie źródła ciepła (piec/pompa)",
    "Próby szczelności i protokoły instalacji końcowych",
    "Uporządkowanie terenu zewnętrznego",
  ],
  "Prace Wykończeniowe (Pod klucz)": [
    "Malowanie ścian i sufitów",
    "Montaż podłóg, listew i drzwi",
    "Biały montaż (hydraulika)",
    "Biały montaż (elektryka)",
    "Zabudowy meblowe / kuchnia",
  ],
  "Odbiory Końcowe": [
    "Przyłącze wod-kan (odbiór wodociągów)",
    "Przyłącze energetyczne i protokół pomiarów",
    "Odbiór kominiarski",
    "Oświadczenie Kierownika Budowy",
    "Zgłoszenie do PINB / Pozwolenie na użytkowanie",
  ],
};

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
        callback(canvas.toDataURL("image/jpeg", 0.6));
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

  const [newLogText, setNewLogText] = useState("");
  const [newLogCustomDate, setNewLogCustomDate] = useState("");
  const [newLogPhotoBase64, setNewLogPhotoBase64] = useState(null);

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

  // Zadania Delegowane
  const [newDelegationTitle, setNewDelegationTitle] = useState("");
  const [newDelegationDesc, setNewDelegationDesc] = useState("");
  const [newDelegationAssignee, setNewDelegationAssignee] = useState("");
  const [newDelegationDeadline, setNewDelegationDeadline] = useState("");

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
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth).catch(console.error);
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
              poranna: true,
              info: true,
              dziennik: true,
              ustalenia: true,
              harmonogram: true,
              finanse: true,
              checklisty: true,
              zdjecia: true,
              raporty: true,
              oferty: true,
              zadania: true,
            };
            currentEditPerms = {
              poranna: true,
              info: true,
              dziennik: true,
              ustalenia: true,
              harmonogram: true,
              finanse: true,
              checklisty: true,
              zdjecia: true,
              raporty: true,
              oferty: true,
              zadania: true,
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
            ? {
                poranna: true,
                info: true,
                dziennik: true,
                ustalenia: true,
                harmonogram: true,
                finanse: true,
                checklisty: true,
                zdjecia: true,
                raporty: true,
                oferty: true,
                zadania: true,
              }
            : {
                poranna: false,
                info: false,
                dziennik: false,
                ustalenia: false,
                harmonogram: false,
                finanse: false,
                checklisty: false,
                zdjecia: false,
                raporty: false,
                oferty: false,
                zadania: true,
              };

          const defaultEditPerms = isAdminEmail
            ? {
                poranna: true,
                info: true,
                dziennik: true,
                ustalenia: true,
                harmonogram: true,
                finanse: true,
                checklisty: true,
                zdjecia: true,
                raporty: true,
                oferty: true,
                zadania: true,
              }
            : {
                poranna: false,
                info: false,
                dziennik: false,
                ustalenia: false,
                harmonogram: false,
                finanse: false,
                checklisty: false,
                zdjecia: false,
                raporty: false,
                oferty: false,
                zadania: false,
              };

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

    const unsubLogs = onSnapshot(
      baseRef("ins_logs"),
      (s) =>
        setLogs(
          s.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => b.timestamp - a.timestamp)
        ),
      console.error
    );
    const unsubChecklists = onSnapshot(
      baseRef("ins_checklists"),
      (s) => {
        const c = {};
        s.docs.forEach((d) => {
          c[d.id] = d.data().items || {};
        });
        setChecklists(c);
      },
      console.error
    );
    const unsubPhotos = onSnapshot(
      baseRef("ins_photos"),
      (s) =>
        setPhotos(
          s.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => b.timestamp - a.timestamp)
        ),
      console.error
    );
    const unsubAgreements = onSnapshot(
      baseRef("ins_agreements"),
      (s) =>
        setAgreements(
          s.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => b.timestamp - a.timestamp)
        ),
      console.error
    );
    const unsubTasks = onSnapshot(
      baseRef("ins_tasks"),
      (s) =>
        setTasks(
          s.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => new Date(a.date) - new Date(b.date))
        ),
      console.error
    );
    const unsubCosts = onSnapshot(
      baseRef("ins_costs"),
      (s) =>
        setCosts(
          s.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => new Date(b.date) - new Date(a.date))
        ),
      console.error
    );
    const unsubBudgets = onSnapshot(
      baseRef("ins_budgets"),
      (s) => {
        const b = {};
        s.docs.forEach((d) => {
          b[d.id] = d.data().totalBudget;
        });
        setBudgets(b);
      },
      console.error
    );
    const unsubCustomTemplates = onSnapshot(
      baseRef("ins_custom_templates"),
      (s) => {
        const t = {};
        s.docs.forEach((d) => {
          t[d.id] = d.data().stages;
        });
        setCustomTemplates(t);
      },
      console.error
    );
    const unsubUsers = onSnapshot(
      baseRef("users_roles"),
      (s) => setUsersList(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      console.error
    );
    const unsubOffers = onSnapshot(
      baseRef("ins_offers"),
      (s) =>
        setOffers(
          s.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => b.timestamp - a.timestamp)
        ),
      console.error
    );
    const unsubDelegations = onSnapshot(
      baseRef("ins_delegations"),
      (s) =>
        setDelegations(
          s.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => b.timestamp - a.timestamp)
        ),
      console.error
    );
    const unsubInstallments = onSnapshot(
      baseRef("ins_installments"),
      (s) =>
        setInstallments(
          s.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => a.timestamp - b.timestamp)
        ),
      console.error
    );

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
      newPerms = {
        poranna: true,
        info: true,
        dziennik: true,
        ustalenia: true,
        harmonogram: true,
        finanse: true,
        checklisty: true,
        zdjecia: true,
        raporty: true,
        oferty: true,
        zadania: true,
      };
      newEditPerms = {
        poranna: true,
        info: true,
        dziennik: true,
        ustalenia: true,
        harmonogram: true,
        finanse: true,
        checklisty: true,
        zdjecia: true,
        raporty: true,
        oferty: true,
        zadania: true,
      };
    } else if (newRole === "pracownik") {
      newPerms = {
        poranna: false,
        info: false,
        dziennik: false,
        ustalenia: false,
        harmonogram: false,
        finanse: false,
        checklisty: false,
        zdjecia: false,
        raporty: false,
        oferty: false,
        zadania: true,
      };
      newEditPerms = {
        poranna: false,
        info: false,
        dziennik: false,
        ustalenia: false,
        harmonogram: false,
        finanse: false,
        checklisty: false,
        zdjecia: false,
        raporty: false,
        oferty: false,
        zadania: false,
      };
    } else if (
      newRole === "inwestor" ||
      newRole === "przedstawiciel inwestora"
    ) {
      newPerms = {
        poranna: false,
        info: true,
        dziennik: true,
        ustalenia: true,
        harmonogram: true,
        finanse: false,
        checklisty: false,
        zdjecia: true,
        raporty: false,
        oferty: true,
        zadania: false,
      };
      newEditPerms = {
        poranna: false,
        info: false,
        dziennik: false,
        ustalenia: false,
        harmonogram: false,
        finanse: false,
        checklisty: false,
        zdjecia: false,
        raporty: false,
        oferty: false,
        zadania: false,
      };
      newAgreementPerms = { inwestor: true, budowa: false, rada: true };
    } else {
      // wykonawca
      newPerms = {
        poranna: false,
        info: false,
        dziennik: true,
        ustalenia: true,
        harmonogram: true,
        finanse: false,
        checklisty: false,
        zdjecia: true,
        raporty: false,
        oferty: true,
        zadania: true,
      };
      newEditPerms = {
        poranna: false,
        info: false,
        dziennik: true,
        ustalenia: true,
        harmonogram: false,
        finanse: false,
        checklisty: false,
        zdjecia: true,
        raporty: false,
        oferty: false,
        zadania: true,
      };
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

  const combinedCalendarItems = [
    ...projTasks.map((t) => ({
      id: t.id,
      type: "task",
      title: t.task,
      date: t.date,
      color: "bg-slate-700", // Domyślny kolor dla ogólnych zadań
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
    };
  };

  if (isAuthLoading)
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 p-4 font-sans">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
          <div className="text-center mb-6">
            <HardHat className="w-12 h-12 text-orange-500 mx-auto mb-2" />
            <h1 className="text-2xl font-bold text-slate-900">
              Nadzór Budowlany
            </h1>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">
              System Kontroli Inwestycji
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500">
                Adres E-mail
              </label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full border rounded-lg p-3 text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="adres@email.com"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Hasło</label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full border rounded-lg p-3 text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="••••••••"
              />
            </div>
            {authError && (
              <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
                {authError}
              </p>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-sm font-bold shadow-md transition"
            >
              {isRegistering ? "Zarejestruj konto" : "Zaloguj się"}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-xs text-blue-600 hover:underline"
            >
              {isRegistering
                ? "Masz już konto? Zaloguj się"
                : "Nie masz konta? Zarejestruj się"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!userData.approved && !isAdministrator) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 p-4 font-sans">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center space-y-4">
          <div className="mx-auto bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center text-amber-600 font-bold text-2xl">
            ⏳
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Konto oczekuje na akceptację
          </h1>
          <p className="text-sm text-slate-500">
            Twoje konto zostało utworzone, ale Administrator musi je najpierw
            zatwierdzić i przydzielić do budów.
          </p>
          <button
            onClick={() => auth.signOut()}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-lg text-sm font-bold transition"
          >
            Wyloguj się
          </button>
        </div>
      </div>
    );
  }

  // WIDOK PODGLĄDU RAPORTU PDF / DRUKU Z PRAWIDŁOWYMI STRONAMI A4
  if (showReportPreview) {
    const data = getFilteredReportData();
    const repCostTotal = data.repCosts.reduce((a, b) => a + (b.amount || 0), 0);
    const spentPercent =
      currentBudget > 0
        ? Math.min(100, Math.round((repCostTotal / currentBudget) * 100))
        : 0;

    return (
      <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto print:static print:bg-white print:overflow-visible print:h-auto print:w-full print:block">
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @media print {
            @page { size: A4 portrait; margin: 15mm; }
            html, body, #root { 
              height: auto !important; 
              overflow: visible !important; 
              background: white !important; 
            }
            .print\\:hidden { display: none !important; }
            .report-page { 
              page-break-after: always; 
              break-after: page; 
              position: relative; 
              box-shadow: none !important; 
              margin: 0 !important; 
              padding: 0 !important; 
            }
            .break-inside-avoid { 
              break-inside: avoid; 
              page-break-inside: avoid; 
            }
            .fixed { position: static !important; }
            .overflow-y-auto { overflow: visible !important; }
            .h-screen { height: auto !important; }
          }
        `,
          }}
        />
        <div className="sticky top-0 bg-slate-900 text-white p-4 flex justify-between items-center shadow-md print:hidden">
          <button
            onClick={() => setShowReportPreview(false)}
            className="bg-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-600 transition"
          >
            Wróć do aplikacji
          </button>
          <button
            onClick={() => window.print()}
            className="bg-blue-600 px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-500 transition"
          >
            Drukuj / Zapisz PDF <Printer className="w-4 h-4" />
          </button>
        </div>

        <div className="max-w-[210mm] mx-auto bg-white min-h-[297mm] my-8 p-12 shadow-xl print:m-0 print:p-0 print:shadow-none print:w-full font-sans text-slate-800 report-page">
          <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold uppercase tracking-tight">
                Raport z Budowy
              </h1>
              <p className="text-slate-500 mt-2">
                Okres zarządczy:{" "}
                <span className="font-semibold text-slate-800">
                  {data.periodStr}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-blue-600 uppercase">
                Inwestor Zastępczy
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Wygenerowano: {new Date().toLocaleDateString("pl-PL")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-10">
            <div>
              <h3 className="text-xs uppercase font-bold text-slate-400 mb-2">
                Inwestycja
              </h3>
              <p className="font-bold text-xl mb-1">{activeProjectData.name}</p>
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
                Progres całkowity budowy (Odbiory)
              </h3>
              <div className="flex items-center justify-between mb-1">
                <span className="text-3xl font-black text-slate-800">
                  {globalProgress}%
                </span>
                <span className="text-xs text-slate-500">
                  {completedChecklistItems} / {totalChecklistItems} pkt.
                </span>
              </div>
              <div className="bg-slate-200 h-2.5 rounded-full mt-2">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${globalProgress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {reportConfig.budget && (
            <div className="mb-10 border border-slate-200 rounded-xl p-6 bg-slate-50/50 break-inside-avoid">
              <h3 className="text-sm uppercase font-bold text-slate-800 mb-4 border-b pb-2">
                Realizacja Budżetu (Ogólna)
              </h3>
              <div className="flex items-center gap-8">
                <div
                  className="w-32 h-32 rounded-full border-8 border-slate-100 relative flex items-center justify-center shadow-inner"
                  style={{
                    background: `conic-gradient(#3b82f6 ${spentPercent}%, transparent 0)`,
                  }}
                >
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center flex-col">
                    <span className="text-xl font-bold">{spentPercent}%</span>
                    <span className="text-[9px] text-slate-400 uppercase">
                      Wydano
                    </span>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500 text-sm">
                      Budżet całkowity (założony)
                    </span>
                    <span className="font-bold text-lg">
                      {formatCurrency(currentBudget)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500 text-sm">
                      Wydatki (w okresie raportu)
                    </span>
                    <span className="font-bold text-lg text-red-600">
                      {formatCurrency(repCostTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500 text-sm font-bold uppercase">
                      Pozostało w budżecie
                    </span>
                    <span className="font-bold text-lg text-emerald-600">
                      {formatCurrency(currentBudget - currentTotalCosts)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {reportConfig.logs && data.repLogs.length > 0 && (
            <div className="mb-10 break-inside-avoid">
              <h3 className="text-sm uppercase font-bold text-slate-800 mb-3 border-b pb-2">
                Wpisy z Dziennika Budowy (z tego okresu)
              </h3>
              <div className="space-y-4">
                {data.repLogs.map((l) => (
                  <div key={l.id} className="text-sm pb-3 break-inside-avoid">
                    <div className="font-bold text-blue-700 mb-1">
                      {l.dateString}
                    </div>
                    <div className="text-slate-700 whitespace-pre-wrap pl-3 border-l-2 border-slate-200">
                      {l.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reportConfig.agreementsInwestor &&
            data.repAgreementsInwestor.length > 0 && (
              <div className="mb-10 break-inside-avoid">
                <h3 className="text-sm uppercase font-bold text-slate-800 mb-3 border-b pb-2">
                  Ustalenia z Inwestorem
                </h3>
                <div className="space-y-3">
                  {data.repAgreementsInwestor.map((a) => (
                    <div
                      key={a.id}
                      className="bg-slate-50 p-3 rounded-lg border text-sm break-inside-avoid"
                    >
                      <div className="text-xs text-slate-500 mb-1">
                        {a.dateString}
                      </div>
                      <div>{a.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {reportConfig.agreementsBudowa &&
            data.repAgreementsBudowa.length > 0 && (
              <div className="mb-10 break-inside-avoid">
                <h3 className="text-sm uppercase font-bold text-slate-800 mb-3 border-b pb-2">
                  Ustalenia na Budowie
                </h3>
                <div className="space-y-3">
                  {data.repAgreementsBudowa.map((a) => (
                    <div
                      key={a.id}
                      className="bg-slate-50 p-3 rounded-lg border text-sm break-inside-avoid"
                    >
                      <div className="text-xs text-slate-500 mb-1">
                        {a.dateString}
                      </div>
                      <div>{a.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {reportConfig.agreementsRada && data.repAgreementsRada.length > 0 && (
            <div className="mb-10 break-inside-avoid">
              <h3 className="text-sm uppercase font-bold text-slate-800 mb-3 border-b pb-2">
                Rady Budowy
              </h3>
              <div className="space-y-3">
                {data.repAgreementsRada.map((a) => (
                  <div
                    key={a.id}
                    className="bg-slate-50 p-3 rounded-lg border text-sm break-inside-avoid"
                  >
                    <div className="text-xs text-slate-500 mb-1">
                      {a.dateString}
                    </div>
                    <div>{a.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reportConfig.checklists && completedChecklistItems > 0 && (
            <div className="mb-10 break-inside-avoid">
              <h3 className="text-sm uppercase font-bold text-slate-800 mb-3 border-b pb-2">
                Czynności i Etapy Zakończone (Odbiór)
              </h3>
              <div className="columns-2 gap-6 text-xs text-slate-700">
                {Object.entries(currentChecklistTemplate).map(
                  ([stage, items]) => {
                    const completed = items.filter(
                      (_, i) => currentCState[`${stage}_${i}`]
                    );
                    if (completed.length === 0) return null;
                    return (
                      <div key={stage} className="break-inside-avoid mb-4">
                        <h4 className="font-bold text-slate-900 mb-1 bg-slate-100 p-1">
                          {stage}
                        </h4>
                        <ul className="list-disc pl-4 space-y-1">
                          {completed.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  }
                )}
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
                  <div
                    key={p.id}
                    className="border p-2 rounded-lg text-center break-inside-avoid"
                  >
                    <img
                      src={p.imageBase64}
                      className="w-full h-48 object-cover rounded mb-2"
                      alt="Foto"
                    />
                    <div className="text-[10px] text-slate-500 font-bold">
                      {p.dateString}
                    </div>
                    {p.description && (
                      <div className="text-xs mt-1">{p.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-16 pt-8 border-t flex justify-between break-inside-avoid">
            <div className="text-center w-48 border-t border-slate-800 pt-2">
              <p className="text-xs uppercase">Podpis Inwestora</p>
            </div>
            <div className="text-center w-48 border-t border-slate-800 pt-2">
              <p className="text-xs uppercase">
                Podpis Inspektora / Koordynatora
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- EKRAN HOME (WYBÓR BUDOWY I USTAWIENIA) ---
  if (currentScreen === "home") {
    return (
      <div className="flex flex-col h-screen bg-slate-100 overflow-hidden font-sans">
        <header className="bg-slate-900 text-white p-4 shadow-md flex justify-between items-center">
          <div className="flex items-center gap-3">
            <HardHat className="w-8 h-8 text-orange-500" />
            <div>
              <h1 className="text-base font-bold">Nadzór Budowlany</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                Zalogowano: {userData.displayName || user.email} (
                {userData.role})
              </p>
            </div>
          </div>
          <button
            onClick={() => auth.signOut()}
            className="bg-slate-800 p-2 rounded-lg text-slate-300 hover:text-white"
            title="Wyloguj"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-6">
          {isAdministrator && (
            <button
              onClick={() => {
                resetProjectForm();
                setIsProjectModalOpen(true);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl shadow-sm flex items-center justify-center gap-2 font-bold transition"
            >
              <Building2 className="w-5 h-5" /> Dodaj nową budowę
            </button>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableProjects.length === 0 && (
              <p className="text-center text-slate-400 p-6 col-span-full">
                Brak przypisanych budów do Twojego konta.
              </p>
            )}
            {availableProjects.map((p) => (
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
                className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:border-blue-500 transition relative group"
              >
                {isAdministrator && (
                  <div className="absolute top-3 right-3 flex gap-2">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(p);
                      }}
                      className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-blue-100 hover:text-blue-600"
                    >
                      <EditIcon className="w-4 h-4" />
                    </div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectToDelete(p.id);
                      }}
                      className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-red-100 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </div>
                  </div>
                )}
                <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-600 mb-1 pr-16">
                  {p.name}
                </h3>
                {p.location && (
                  <div className="text-sm text-slate-500 flex items-center gap-1 mt-2">
                    <MapPin className="w-4 h-4" /> {p.location}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* PANEL ADMINISTRATORA: UŻYTKOWNICY */}
          {isAdministrator && (
            <div className="bg-white rounded-xl shadow-sm border p-5 mt-8">
              <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" /> Panel
                Użytkowników
              </h3>
              <div className="space-y-6">
                {usersList.map((u) => (
                  <div
                    key={u.id}
                    className="border p-4 rounded-xl bg-slate-50 space-y-4"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                      <div>
                        <p className="font-bold text-sm text-slate-800 flex items-center gap-2">
                          <UserPlus className="w-4 h-4 text-slate-500" />
                          {u.displayName || u.email}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                          <input
                            type="text"
                            placeholder="Imię i nazwisko"
                            defaultValue={u.displayName || ""}
                            onBlur={(e) =>
                              handleUpdateDisplayName(u.id, e.target.value)
                            }
                            className="border border-slate-300 rounded p-1 text-xs font-bold bg-white w-40"
                          />
                          <button
                            onClick={() =>
                              handleToggleApproval(u.id, u.approved)
                            }
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition flex items-center gap-1 ${
                              u.approved
                                ? "bg-green-600 text-white"
                                : "bg-amber-500 text-white"
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
                            onChange={(e) =>
                              handleRoleChangeForUser(u.id, e.target.value)
                            }
                            className="border rounded p-1 text-xs font-bold bg-white"
                          >
                            <option value="administrator">Administrator</option>
                            <option value="zarząd">Zarząd</option>
                            <option value="kierownik budowy">
                              Kierownik budowy
                            </option>
                            <option value="inspektor">Inspektor</option>
                            <option value="przedstawiciel inwestora">
                              Przedstawiciel inwestora
                            </option>
                            <option value="inwestor">Inwestor</option>
                            <option value="pracownik">Pracownik firmy</option>
                            <option value="wykonawca">Wykonawca</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setUserToDelete(u.id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                          title="Usuń konto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Kolor Użytkownika w kalendarzu */}
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase block mb-1">
                          Kolor w kalendarzu / harmonogramie:
                        </span>
                        <select
                          value={u.color || "bg-slate-500"}
                          onChange={(e) =>
                            handleUserColorChange(u.id, e.target.value)
                          }
                          className="border rounded p-1.5 text-xs font-bold bg-white w-full"
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

                      {/* Zakres działania dla Wykonawcy */}
                      {u.role === "wykonawca" && (
                        <div>
                          <span className="text-xs font-bold text-slate-500 uppercase block mb-1">
                            Zakres działania (etap robót):
                          </span>
                          <input
                            type="text"
                            placeholder="Np. Stan surowy, instalacje wod-kan..."
                            value={u.contractorScope || ""}
                            onChange={(e) =>
                              handleSaveContractorScope(u.id, e.target.value)
                            }
                            className="w-full border rounded p-1.5 text-xs bg-white"
                          />
                        </div>
                      )}
                    </div>

                    {/* Zarządzanie uprawnieniami (Widoczność, Edycja, Podział ustaleń) */}
                    <div className="pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                          Widoczność zakładek:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(u.permissions || {}).map(
                            ([tabKey, isAllowed]) => (
                              <button
                                key={tabKey}
                                onClick={() =>
                                  handleTogglePermission(
                                    u.id,
                                    u.permissions,
                                    tabKey
                                  )
                                }
                                className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                  isAllowed
                                    ? "bg-green-100 text-green-700 border border-green-300"
                                    : "bg-slate-200 text-slate-600"
                                }`}
                              >
                                {tabKey}: {isAllowed ? "WIDOCZNY" : "UKRYTY"}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                          Uprawnienie do dodawania / edycji:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(u.editPermissions || {}).map(
                            ([tabKey, canEdit]) => (
                              <button
                                key={tabKey}
                                onClick={() =>
                                  handleToggleEditPermission(
                                    u.id,
                                    u.editPermissions,
                                    tabKey
                                  )
                                }
                                className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                  canEdit
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-200 text-slate-600"
                                }`}
                              >
                                {tabKey}: {canEdit ? "EDYCJA" : "PODGLĄD"}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                          Widoczność ustaleń:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(
                            u.agreementPermissions || {
                              inwestor: true,
                              budowa: true,
                              rada: true,
                            }
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
                                  ? "bg-purple-100 text-purple-700 border border-purple-300"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {agrKey}: {agrAllowed ? "WIDOCZNE" : "UKRYTE"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-xs font-bold text-slate-500 uppercase block mb-1">
                        Dostęp do budów:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {projects.map((proj) => {
                          const isAssigned = (
                            u.assignedProjects || []
                          ).includes(proj.id);
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
                              className={`text-xs px-3 py-1 rounded-lg border font-medium flex items-center gap-1 transition ${
                                isAssigned
                                  ? "bg-blue-600 text-white"
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

        {userToDelete && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 print:hidden">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center shadow-xl">
              <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center text-red-600 mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold mb-2">Usunąć użytkownika?</h2>
              <p className="text-sm text-slate-500 mb-6">
                Tej operacji nie można cofnąć.
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

        {projectToDelete && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 print:hidden">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center shadow-xl">
              <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center text-red-600 mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold mb-2">Usunąć budowę?</h2>
              <p className="text-sm text-slate-500 mb-6">
                Tej operacji nie można cofnąć.
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
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-md"
                >
                  Usuń Trwale
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- WIDOK ZAKŁADEK BUDOWY ---
  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <div className="flex-shrink-0 z-10 print:hidden">
        <header className="bg-slate-900 text-white p-3 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentScreen("home")}
              className="bg-slate-800 p-2 rounded-lg text-slate-300 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm font-bold leading-tight truncate max-w-[200px]">
                {activeProjectData?.name}
              </h1>
              <p className="text-[10px] text-orange-400 uppercase tracking-widest">
                {userData.role}
              </p>
            </div>
          </div>

          {/* PRZENIESIONE MENU ZAKŁADEK - POZIOME SKROlowane MENU GÓRNE */}
          <nav className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden w-full md:w-auto bg-slate-800 rounded-lg p-1">
            {[
              {
                id: "poranna",
                icon: Sun,
                label: "Poranna",
                key: "poranna",
                adminOnly: true,
              },
              {
                id: "oferty",
                icon: FileSpreadsheet,
                label: "Oferty",
                key: "oferty",
              },
              { id: "info", icon: Info, label: "Info", key: "info" },
              {
                id: "dziennik",
                icon: BookOpen,
                label: "Dziennik",
                key: "dziennik",
              },
              {
                id: "ustalenia",
                icon: Handshake,
                label: "Ustalenia",
                key: "ustalenia",
              },
              {
                id: "harmonogram",
                icon: CalendarDays,
                label: "Plan",
                key: "harmonogram",
              },
              { id: "finanse", icon: Wallet, label: "Koszty", key: "finanse" },
              {
                id: "checklisty",
                icon: ClipboardCheck,
                label: "Odbiory",
                key: "checklisty",
              },
              { id: "zdjecia", icon: ImageIcon, label: "Zdj.", key: "zdjecia" },
              {
                id: "zadania",
                icon: CheckSquare,
                label: "Zadania",
                key: "zadania",
              },
              {
                id: "raporty",
                icon: FileText,
                label: "Raport",
                key: "raporty",
              },
            ].map((t) => {
              if (t.adminOnly && !isAdministrator) return null;
              if (!t.adminOnly && t.key !== "poranna" && !canViewTab(t.key))
                return null;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 py-1.5 px-3 whitespace-nowrap rounded-md text-xs font-bold transition-colors ${
                    activeTab === t.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  <t.icon className="w-4 h-4" /> <span>{t.label}</span>
                </button>
              );
            })}
          </nav>
        </header>
      </div>

      <main className="flex-1 overflow-y-auto p-4 print:p-0">
        <div className="max-w-3xl mx-auto print:max-w-full">
          {/* OFERTY */}
          {activeTab === "oferty" && (
            <div className="space-y-6 animate-in fade-in">
              {canEditTab("oferty") && (
                <div className="bg-white rounded-xl shadow-sm border p-4 border-t-4 border-t-blue-600 print:hidden">
                  <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-blue-600" /> Dodaj
                    ofertę / wycenę dostawcy
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Dostawca / Wykonawca / Kooperant"
                      value={newOfferSupplier}
                      onChange={(e) => setNewOfferSupplier(e.target.value)}
                      className="border rounded-lg p-2.5 text-sm bg-slate-50"
                    />
                    <select
                      value={newOfferStatus}
                      onChange={(e) => setNewOfferStatus(e.target.value)}
                      className="border rounded-lg p-2.5 text-sm bg-slate-50 font-bold"
                    >
                      <option value="Oczekuje">Status: Oczekuje</option>
                      <option value="Zaakceptowana">
                        Status: Zaakceptowana
                      </option>
                      <option value="Odrzucona">Status: Odrzucona</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                        Kwota kosztowa (dla nas / dostawcy):
                      </label>
                      <input
                        type="number"
                        placeholder="PLN"
                        value={newOfferCostPrice}
                        onChange={(e) => setNewOfferCostPrice(e.target.value)}
                        className="w-full border rounded-lg p-2.5 text-sm bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                        Kwota uzgodniona z inwestorem:
                      </label>
                      <input
                        type="number"
                        placeholder="PLN"
                        value={newOfferInvestorPrice}
                        onChange={(e) =>
                          setNewOfferInvestorPrice(e.target.value)
                        }
                        className="w-full border rounded-lg p-2.5 text-sm bg-slate-50"
                      />
                    </div>
                  </div>
                  <textarea
                    placeholder="Opis materiału, usługi lub zakresu..."
                    value={newOfferDesc}
                    onChange={(e) => setNewOfferDesc(e.target.value)}
                    className="w-full border rounded-lg p-3 text-sm bg-slate-50 min-h-[70px] mb-3"
                  />
                  <button
                    onClick={() => {
                      if (!newOfferSupplier.trim() || !newOfferCostPrice)
                        return;
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
                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-bold shadow-sm"
                  >
                    Zapisz ofertę
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {projOffers.length === 0 && (
                  <p className="text-center text-slate-400 py-8">
                    Brak zarejestrowanych ofert dla tej budowy.
                  </p>
                )}
                {projOffers.map((off) => {
                  const profit =
                    (off.investorPrice || 0) - (off.costPrice || 0);
                  const isEditing = editingOfferId === off.id;
                  return (
                    <div
                      key={off.id}
                      className="bg-white rounded-xl shadow-sm border p-5 relative group border-l-4 border-l-blue-500"
                    >
                      {canEditTab("oferty") && (
                        <div className="absolute top-4 right-4 flex gap-2">
                          <button
                            onClick={() => {
                              if (isEditing) {
                                genericUpdate("ins_offers", off.id, {
                                  supplier: editOfferSupplier,
                                  description: editOfferDesc,
                                  costPrice:
                                    parseFloat(editOfferCostPrice) || 0,
                                  investorPrice:
                                    parseFloat(editOfferInvestorPrice) || 0,
                                  status: editOfferStatus,
                                });
                                setEditingOfferId(null);
                              } else {
                                setEditingOfferId(off.id);
                                setEditOfferSupplier(off.supplier || "");
                                setEditOfferDesc(off.description || "");
                                setEditOfferCostPrice(off.costPrice || "");
                                setEditOfferInvestorPrice(
                                  off.investorPrice || ""
                                );
                                setEditOfferStatus(off.status || "Oczekuje");
                              }
                            }}
                            className="text-blue-500 hover:text-blue-700 p-1"
                            title="Edytuj ofertę"
                          >
                            <EditIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => genericDel("ins_offers", off.id)}
                            className="text-slate-300 hover:text-red-500 p-1"
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
                              onChange={(e) =>
                                setEditOfferSupplier(e.target.value)
                              }
                              className="border rounded p-2 text-sm bg-slate-50"
                              placeholder="Dostawca"
                            />
                            <select
                              value={editOfferStatus}
                              onChange={(e) =>
                                setEditOfferStatus(e.target.value)
                              }
                              className="border rounded p-2 text-sm font-bold bg-slate-50"
                            >
                              <option value="Oczekuje">Oczekuje</option>
                              <option value="Zaakceptowana">
                                Zaakceptowana
                              </option>
                              <option value="Odrzucona">Odrzucona</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <input
                              type="number"
                              value={editOfferCostPrice}
                              onChange={(e) =>
                                setEditOfferCostPrice(e.target.value)
                              }
                              className="border rounded p-2 text-sm bg-slate-50"
                              placeholder="Koszt"
                            />
                            <input
                              type="number"
                              value={editOfferInvestorPrice}
                              onChange={(e) =>
                                setEditOfferInvestorPrice(e.target.value)
                              }
                              className="border rounded p-2 text-sm bg-slate-50"
                              placeholder="Inwestor"
                            />
                          </div>
                          <textarea
                            value={editOfferDesc}
                            onChange={(e) => setEditOfferDesc(e.target.value)}
                            className="w-full border rounded p-2 text-sm bg-slate-50"
                            placeholder="Opis"
                          />
                          <button
                            onClick={() => {
                              genericUpdate("ins_offers", off.id, {
                                supplier: editOfferSupplier,
                                description: editOfferDesc,
                                costPrice: parseFloat(editOfferCostPrice) || 0,
                                investorPrice:
                                  parseFloat(editOfferInvestorPrice) || 0,
                                status: editOfferStatus,
                              });
                              setEditingOfferId(null);
                            }}
                            className="bg-green-600 text-white px-4 py-1.5 rounded text-xs font-bold"
                          >
                            Zapisz zmiany
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-2 pr-16">
                            <div>
                              <h4 className="font-bold text-base text-slate-900">
                                {off.supplier}
                              </h4>
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-1 ${
                                  off.status === "Zaakceptowana"
                                    ? "bg-green-100 text-green-700"
                                    : off.status === "Odrzucona"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {off.status}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400">
                              {off.dateStr}
                            </span>
                          </div>

                          {off.description && (
                            <p className="text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg">
                              {off.description}
                            </p>
                          )}

                          <div className="grid grid-cols-3 gap-3 pt-3 border-t text-center">
                            <div className="bg-slate-50 p-2 rounded-lg">
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                                Koszt dostawcy
                              </span>
                              <span className="font-bold text-slate-800">
                                {formatCurrency(off.costPrice)}
                              </span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg">
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                                Cena z inwestorem
                              </span>
                              <span className="font-bold text-blue-600">
                                {formatCurrency(off.investorPrice)}
                              </span>
                            </div>
                            <div
                              className={`p-2 rounded-lg ${
                                profit >= 0
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              <span className="text-[10px] uppercase font-bold block opacity-75">
                                Marża / Zysk
                              </span>
                              <span className="font-bold">
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

          {/* PORANNA LISTA (TYLKO ADMIN) */}
          {activeTab === "poranna" && isAdministrator && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white rounded-xl shadow-sm border p-6 border-t-4 border-t-amber-500 relative">
                <div className="flex justify-between items-center mb-6 print:hidden">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
                      <Sun className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">
                        Poranna Lista / To-Do
                      </h2>
                      <p className="text-xs text-slate-500">
                        Zadania na dziś i tydzień dla inwestycji:{" "}
                        <strong className="text-slate-800">
                          {activeProjectData?.name}
                        </strong>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow transition"
                  >
                    <Printer className="w-4 h-4" /> Drukuj Listę
                  </button>
                </div>

                <div className="mb-8">
                  <h3 className="text-sm uppercase font-bold text-slate-400 mb-3 border-b pb-2 flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-500 rounded-full inline-block"></span>{" "}
                    Zadania na Dzisiaj ({new Date().toLocaleDateString("pl-PL")}
                    )
                  </h3>
                  {todayTasks.length === 0 ? (
                    <p className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-lg border">
                      Brak zaplanowanych zadań na dzisiaj.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {todayTasks.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                        >
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-slate-800 flex-1">
                            {t.title || t.task}{" "}
                            <span className="text-xs text-slate-400 ml-2">
                              ({getShortUserName(t.assignee) || "Ogólne"})
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm uppercase font-bold text-slate-400 mb-3 border-b pb-2 flex items-center gap-2">
                    <span className="w-3 h-3 bg-emerald-500 rounded-full inline-block"></span>{" "}
                    Zadania na Bieżący Tydzień
                  </h3>
                  {weekTasks.length === 0 ? (
                    <p className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-lg border">
                      Brak zaplanowanych zadań w tym tygodniu.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {weekTasks.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                        >
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-sm font-medium text-slate-800 flex-1">
                            {t.title || t.task}{" "}
                            <span className="text-xs text-slate-400 ml-2">
                              ({getShortUserName(t.assignee) || "Ogólne"})
                            </span>
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-mono">
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

          {/* INFO */}
          {activeTab === "info" && canViewTab("info") && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-white rounded-xl shadow-sm border p-6 text-center border-t-4 border-t-orange-500 relative">
                {canEditTab("info") && (
                  <button
                    onClick={() => openEditModal(activeProjectData)}
                    className="absolute top-4 right-4 bg-slate-100 p-2 rounded-lg text-slate-500 hover:text-blue-600"
                  >
                    <EditIcon className="w-4 h-4" />
                  </button>
                )}
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h2 className="text-2xl font-bold text-slate-800 mb-1">
                  {activeProjectData?.name}
                </h2>
                <p className="text-sm text-slate-500">
                  {activeProjectData?.description || "Brak opisu inwestycji."}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl shadow-sm border p-4 flex gap-3 items-start">
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">
                      Inwestor
                    </p>
                    <p className="font-medium">
                      {activeProjectData?.investor || "-"}
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4 flex gap-3 items-start">
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">
                      Lokalizacja
                    </p>
                    <p className="font-medium">
                      {activeProjectData?.location || "-"}
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4 flex gap-3 items-start md:col-span-2">
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">
                      Telefon
                    </p>
                    <p className="font-medium">
                      {activeProjectData?.phone || "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DZIENNIK */}
          {activeTab === "dziennik" && (
            <div className="space-y-6 animate-in fade-in">
              {canEditTab("dziennik") && (
                <div className="bg-white rounded-xl shadow-sm border p-4 print:hidden">
                  <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-500" /> Nowy wpis
                  </h2>
                  <div className="mb-3">
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Data wpisu (domyślnie teraz):
                    </label>
                    <input
                      type="datetime-local"
                      value={newLogCustomDate}
                      onChange={(e) => setNewLogCustomDate(e.target.value)}
                      className="bg-slate-50 border rounded-md p-2 text-sm w-full md:w-auto"
                    />
                  </div>
                  <textarea
                    value={newLogText}
                    onChange={(e) => setNewLogText(e.target.value)}
                    placeholder="Zanotuj postęp prac..."
                    className="w-full bg-slate-50 border rounded-lg p-3 text-sm min-h-[100px]"
                  />
                  {newLogPhotoBase64 && (
                    <div className="mt-3 relative inline-block">
                      <img
                        src={newLogPhotoBase64}
                        alt="Załącznik"
                        className="h-24 rounded-md object-cover border"
                      />
                      <button
                        onClick={() => setNewLogPhotoBase64(null)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
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
                            if (logPhotoRef.current)
                              logPhotoRef.current.value = "";
                          });
                        }
                      }}
                    />
                    <button
                      onClick={() => logPhotoRef.current?.click()}
                      className="text-slate-500 text-sm flex gap-1 items-center p-2"
                    >
                      <Paperclip className="w-4 h-4" /> Zdjęcie
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
                          },
                          () => {
                            setNewLogText("");
                            setNewLogPhotoBase64(null);
                            setNewLogCustomDate("");
                          }
                        );
                      }}
                      disabled={!newLogText.trim()}
                      className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium"
                    >
                      Zapisz
                    </button>
                  </div>
                </div>
              )}
              {logs
                .filter((l) => l.projectId === activeProjectId)
                .map((log) => {
                  const isEditing = editingLogId === log.id;
                  return (
                    <div
                      key={log.id}
                      className="bg-white rounded-xl shadow-sm border overflow-hidden relative"
                    >
                      <div className="bg-slate-50 px-4 py-2 border-b flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-500">
                          {log.dateString}
                        </span>
                        {canEditTab("dziennik") && (
                          <div className="flex gap-2 print:hidden">
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
                              className="text-blue-500 hover:text-blue-700 p-1"
                              title="Edytuj wpis"
                            >
                              <EditIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => genericDel("ins_logs", log.id)}
                              className="text-slate-300 hover:text-red-500 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              value={editLogText}
                              onChange={(e) => setEditLogText(e.target.value)}
                              className="w-full border rounded p-2 text-sm bg-slate-50 min-h-[80px]"
                            />
                            <button
                              onClick={() => {
                                genericUpdate("ins_logs", log.id, {
                                  text: editLogText,
                                });
                                setEditingLogId(null);
                              }}
                              className="bg-green-600 text-white px-4 py-1.5 rounded text-xs font-bold"
                            >
                              Zapisz zmiany
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">
                            {log.text}
                          </p>
                        )}
                        {log.photoBase64 && (
                          <img
                            src={log.photoBase64}
                            alt="Zdj"
                            className="mt-3 rounded-lg max-h-60 border"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* USTALENIA Z UWZGLĘDNIENIEM WIDOCZNOŚCI PODZAKŁADEK */}
          {activeTab === "ustalenia" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex bg-slate-200/50 p-1 rounded-lg print:hidden">
                {[
                  {
                    id: "inwestor",
                    icon: Users,
                    label: "Z Inwestorem",
                    key: "inwestor",
                  },
                  {
                    id: "budowa",
                    icon: HardHat,
                    label: "Na budowie",
                    key: "budowa",
                  },
                  {
                    id: "rada",
                    icon: Gavel,
                    label: "Rady budowy",
                    key: "rada",
                  },
                ].map((t) => {
                  if (!canViewAgreementType(t.key)) return null;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setAgreementType(t.id)}
                      className={`flex-1 flex flex-col items-center py-2 px-1 rounded-md text-xs font-medium ${
                        agreementType === t.id
                          ? "bg-white text-blue-700 shadow-sm"
                          : "text-slate-500"
                      }`}
                    >
                      <t.icon className="w-4 h-4 mb-1" />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {canEditTab("ustalenia") &&
                canViewAgreementType(agreementType) && (
                  <div className="bg-white rounded-xl shadow-sm border p-4 border-l-4 border-l-blue-500 print:hidden">
                    <div className="mb-3">
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                        Data (opcjonalna):
                      </label>
                      <input
                        type="datetime-local"
                        value={newAgreementDate}
                        onChange={(e) => setNewAgreementDate(e.target.value)}
                        className="bg-slate-50 border rounded-md p-1.5 text-xs w-full md:w-auto"
                      />
                    </div>
                    <textarea
                      value={newAgreementText}
                      onChange={(e) => setNewAgreementText(e.target.value)}
                      placeholder="Zanotuj nowe ustalenia..."
                      className="w-full bg-slate-50 border rounded-lg p-3 text-sm min-h-[80px]"
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
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                      >
                        Zapisz ustalenia
                      </button>
                    </div>
                  </div>
                )}

              {canViewAgreementType(agreementType) &&
                agreements
                  .filter(
                    (a) =>
                      a.projectId === activeProjectId &&
                      a.type === agreementType
                  )
                  .map((agr) => {
                    const isEditing = editingAgreementId === agr.id;
                    return (
                      <div
                        key={agr.id}
                        className="bg-white rounded-xl shadow-sm border p-4 relative"
                      >
                        {canEditTab("ustalenia") && (
                          <div className="absolute top-3 right-3 flex gap-2 print:hidden">
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
                              className="text-blue-500 hover:text-blue-700 p-1"
                              title="Edytuj ustalenie"
                            >
                              <EditIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                genericDel("ins_agreements", agr.id)
                              }
                              className="text-slate-300 hover:text-red-500 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        <div className="text-xs text-slate-400 mb-2">
                          {agr.dateString}
                        </div>
                        {isEditing ? (
                          <div className="space-y-2 mt-2">
                            <textarea
                              value={editAgreementText}
                              onChange={(e) =>
                                setEditAgreementText(e.target.value)
                              }
                              className="w-full border rounded p-2 text-sm bg-slate-50 min-h-[70px]"
                            />
                            <button
                              onClick={() => {
                                genericUpdate("ins_agreements", agr.id, {
                                  text: editAgreementText,
                                });
                                setEditingAgreementId(null);
                              }}
                              className="bg-green-600 text-white px-4 py-1.5 rounded text-xs font-bold"
                            >
                              Zapisz zmiany
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm">{agr.text}</p>
                        )}
                      </div>
                    );
                  })}
            </div>
          )}

          {/* HARMONOGRAM / PLAN */}
          {activeTab === "harmonogram" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-slate-200/50 p-1 rounded-lg flex max-w-sm mx-auto print:hidden">
                {["month", "week", "day"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setCalendarView(m)}
                    className={`flex-1 py-1.5 text-xs uppercase font-bold rounded-md ${
                      calendarView === m
                        ? "bg-white shadow text-emerald-700"
                        : "text-slate-500"
                    }`}
                  >
                    {m === "month"
                      ? "Miesiąc"
                      : m === "week"
                      ? "Tydzień"
                      : "Dzień"}
                  </button>
                ))}
              </div>

              {isAdministrator && (
                <div className="bg-white rounded-xl shadow-sm border p-4 print:hidden border-t-4 border-t-slate-500">
                  <h3 className="text-xs uppercase font-bold text-slate-500 mb-2">
                    Filtrowanie użytkowników (Admin)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {usersList.map((u) => (
                      <label
                        key={u.id}
                        className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded border cursor-pointer transition ${
                          visibleUsersInCalendar.includes(u.email)
                            ? "bg-slate-100 border-slate-300"
                            : "bg-white border-slate-200 opacity-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={visibleUsersInCalendar.includes(u.email)}
                          onChange={() => toggleVisibleUser(u.email)}
                          className="w-3 h-3"
                        />
                        <span
                          className={`w-2 h-2 rounded-full ${
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
                <div className="bg-white rounded-xl shadow-sm border p-4 print:hidden border-t-4 border-t-emerald-500">
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={newTaskDate}
                        onChange={(e) => setNewTaskDate(e.target.value)}
                        className="bg-slate-50 border rounded-lg p-2.5 text-sm w-36"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Dodaj zadanie do planu (ogólne)..."
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        className="flex-1 bg-slate-50 border rounded-lg p-2.5 text-sm"
                      />
                      <button
                        onClick={() =>
                          genericAdd(
                            "ins_tasks",
                            {
                              date: newTaskDate,
                              task: newTaskText,
                              color: "bg-slate-700",
                            },
                            () => {
                              setNewTaskDate("");
                              setNewTaskText("");
                            }
                          )
                        }
                        disabled={!newTaskDate || !newTaskText.trim()}
                        className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold"
                      >
                        Zapisz
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-sm border p-4 print:border-none print:shadow-none print:p-0">
                <div className="flex justify-between items-center mb-4 border-b pb-3 print:border-b-0 print:mb-2">
                  <button
                    onClick={() => moveDate(-1, calendarView)}
                    className="p-2 bg-slate-100 rounded hover:bg-slate-200 print:hidden"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h3 className="font-bold text-lg uppercase tracking-wide print:text-black">
                    {calendarView === "month" &&
                      currentCalDate.toLocaleDateString("pl-PL", {
                        month: "long",
                        year: "numeric",
                      })}
                    {calendarView === "week" &&
                      `Tydzień od ${getWeekDays(
                        currentCalDate
                      )[0].toLocaleDateString("pl-PL")}`}
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
                      className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 print:hidden"
                      title="Drukuj PDF"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => moveDate(1, calendarView)}
                      className="p-2 bg-slate-100 rounded hover:bg-slate-200 print:hidden"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Widok: MIESIĄC */}
                {calendarView === "month" && (
                  <>
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2 uppercase print:text-black">
                      <div>PN</div>
                      <div>WT</div>
                      <div>ŚR</div>
                      <div>CZ</div>
                      <div>PT</div>
                      <div>SB</div>
                      <div>ND</div>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
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
                                className="aspect-square bg-slate-50/50 rounded print:border print:border-slate-200"
                              ></div>
                            );
                          const dateStr = `${currentCalDate.getFullYear()}-${(
                            currentCalDate.getMonth() + 1
                          )
                            .toString()
                            .padStart(2, "0")}-${day
                            .toString()
                            .padStart(2, "0")}`;

                          const dayItems = combinedCalendarItems.filter(
                            (item) => {
                              if (item.date !== dateStr) return false;
                              if (
                                isAdministrator &&
                                visibleUsersInCalendar.length > 0 &&
                                item.assignee &&
                                !visibleUsersInCalendar.includes(item.assignee)
                              )
                                return false;
                              return true;
                            }
                          );

                          return (
                            <div
                              key={i}
                              className={`aspect-square border rounded p-1 flex flex-col ${
                                dayItems.length > 0
                                  ? "bg-slate-50 border-slate-300"
                                  : "bg-white border-slate-100"
                              }`}
                            >
                              <span
                                className={`text-[10px] font-bold ${
                                  dayItems.length > 0
                                    ? "text-slate-800"
                                    : "text-slate-400"
                                } print:text-black`}
                              >
                                {day}
                              </span>
                              <div className="flex-1 flex flex-col gap-0.5 mt-1 overflow-hidden">
                                {dayItems.map((item, idx) => {
                                  const isEditing =
                                    editingTaskId === item.id &&
                                    item.type === "task";
                                  const taskLabel =
                                    item.type === "task"
                                      ? item.title
                                      : `${item.title} (${getShortUserName(
                                          item.assignee
                                        )})`;
                                  return (
                                    <div
                                      key={idx}
                                      className={`${item.color} text-white text-[8px] break-words px-1 rounded-sm leading-tight relative group`}
                                      title={taskLabel}
                                    >
                                      {isEditing ? (
                                        <div className="p-1 bg-white text-slate-800 z-20 absolute inset-0 flex flex-col gap-1">
                                          <input
                                            type="text"
                                            value={editTaskText}
                                            onChange={(e) =>
                                              setEditTaskText(e.target.value)
                                            }
                                            className="border text-[9px] p-0.5 w-full"
                                          />
                                          <input
                                            type="date"
                                            value={editTaskDate}
                                            onChange={(e) =>
                                              setEditTaskDate(e.target.value)
                                            }
                                            className="border text-[9px] p-0.5 w-full"
                                          />
                                          <button
                                            onClick={() => {
                                              genericUpdate(
                                                "ins_tasks",
                                                item.id,
                                                {
                                                  task: editTaskText,
                                                  date: editTaskDate,
                                                }
                                              );
                                              setEditingTaskId(null);
                                            }}
                                            className="bg-green-600 text-white text-[8px] py-0.5 rounded font-bold"
                                          >
                                            OK
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex justify-between items-center w-full">
                                          <span className="truncate">
                                            {taskLabel}
                                          </span>
                                          {canEditTab("harmonogram") &&
                                            item.type === "task" && (
                                              <span
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setEditingTaskId(item.id);
                                                  setEditTaskText(
                                                    item.raw.task
                                                  );
                                                  setEditTaskDate(
                                                    item.raw.date
                                                  );
                                                }}
                                                className="opacity-0 group-hover:opacity-100 cursor-pointer ml-1 text-[7px] bg-black/40 px-1 rounded print:hidden"
                                              >
                                                ✏️
                                              </span>
                                            )}
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
                  <div className="grid grid-cols-7 gap-2">
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
                          className="border rounded-lg min-h-[200px] flex flex-col bg-slate-50/30"
                        >
                          <div className="bg-slate-100 text-center py-2 border-b text-xs font-bold text-slate-600 uppercase print:bg-white print:border-b-2">
                            {d.toLocaleDateString("pl-PL", {
                              weekday: "short",
                            })}{" "}
                            <span className="text-slate-400 font-normal">
                              {d.getDate()}
                            </span>
                          </div>
                          <div className="p-1 space-y-1">
                            {dayItems.map((item, idx) => {
                              const isEditing =
                                editingTaskId === item.id &&
                                item.type === "task";
                              const taskLabel =
                                item.type === "task"
                                  ? item.title
                                  : `${item.title} (${getShortUserName(
                                      item.assignee
                                    )})`;
                              return (
                                <div
                                  key={idx}
                                  className={`${item.color} text-white text-[9px] p-1.5 rounded shadow-sm relative group`}
                                  title={taskLabel}
                                >
                                  {isEditing ? (
                                    <div className="p-1 bg-white text-slate-800 space-y-1">
                                      <input
                                        type="text"
                                        value={editTaskText}
                                        onChange={(e) =>
                                          setEditTaskText(e.target.value)
                                        }
                                        className="border text-[10px] p-1 w-full"
                                      />
                                      <input
                                        type="date"
                                        value={editTaskDate}
                                        onChange={(e) =>
                                          setEditTaskDate(e.target.value)
                                        }
                                        className="border text-[10px] p-1 w-full"
                                      />
                                      <button
                                        onClick={() => {
                                          genericUpdate("ins_tasks", item.id, {
                                            task: editTaskText,
                                            date: editTaskDate,
                                          });
                                          setEditingTaskId(null);
                                        }}
                                        className="bg-green-600 text-white text-[9px] px-2 py-0.5 rounded font-bold"
                                      >
                                        Zapisz
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <span className="block break-words font-bold">
                                        {taskLabel}
                                      </span>
                                      {canEditTab("harmonogram") &&
                                        item.type === "task" && (
                                          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 print:hidden">
                                            <span
                                              onClick={() => {
                                                setEditingTaskId(item.id);
                                                setEditTaskText(item.raw.task);
                                                setEditTaskDate(item.raw.date);
                                              }}
                                              className="cursor-pointer bg-black/40 px-1 rounded text-[8px]"
                                              title="Edytuj"
                                            >
                                              ✏️
                                            </span>
                                            <Trash2
                                              className="w-3 h-3 cursor-pointer"
                                              onClick={() =>
                                                genericDel("ins_tasks", item.id)
                                              }
                                            />
                                          </div>
                                        )}
                                    </>
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
                        {dayItems.map((item) => {
                          const isEditing =
                            editingTaskId === item.id && item.type === "task";
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-4 border rounded-xl shadow-sm"
                            >
                              {isEditing ? (
                                <div className="flex-1 flex gap-2 items-center mr-4">
                                  <input
                                    type="text"
                                    value={editTaskText}
                                    onChange={(e) =>
                                      setEditTaskText(e.target.value)
                                    }
                                    className="border p-1.5 text-sm flex-1"
                                  />
                                  <input
                                    type="date"
                                    value={editTaskDate}
                                    onChange={(e) =>
                                      setEditTaskDate(e.target.value)
                                    }
                                    className="border p-1.5 text-sm"
                                  />
                                  <button
                                    onClick={() => {
                                      genericUpdate("ins_tasks", item.id, {
                                        task: editTaskText,
                                        date: editTaskDate,
                                      });
                                      setEditingTaskId(null);
                                    }}
                                    className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold"
                                  >
                                    OK
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-4 h-4 rounded-full ${item.color}`}
                                  ></div>
                                  <div>
                                    <span className="font-medium text-slate-700 block">
                                      {item.type === "task"
                                        ? item.raw.task
                                        : item.title}
                                    </span>
                                    {item.assignee && (
                                      <span className="text-xs text-slate-400">
                                        {getShortUserName(item.assignee)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                              {canEditTab("harmonogram") &&
                                item.type === "task" && (
                                  <div className="flex gap-2 print:hidden">
                                    <button
                                      onClick={() => {
                                        setEditingTaskId(item.id);
                                        setEditTaskText(item.raw.task);
                                        setEditTaskDate(item.raw.date);
                                      }}
                                      className="text-blue-500 hover:text-blue-700 p-1"
                                    >
                                      <EditIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                      className="text-slate-300 hover:text-red-500"
                                      onClick={() =>
                                        genericDel("ins_tasks", item.id)
                                      }
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </div>
                                )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
              </div>
            </div>
          )}

          {/* FINANSE / KOSZTY Z EDYCJĄ ADMINA */}
          {activeTab === "finanse" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-col justify-center">
                  <div className="text-[10px] text-slate-500 uppercase mb-1 font-bold">
                    Budżet całkowity
                  </div>
                  <div className="text-lg font-bold text-slate-800">
                    {formatCurrency(currentBudget)}
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-col justify-center">
                  <div className="text-[10px] text-slate-500 uppercase mb-1 font-bold">
                    Wpłaty od inwestora
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatCurrency(totalPaid)}
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-col justify-center">
                  <div className="text-[10px] text-slate-500 uppercase mb-1 font-bold">
                    Do rozliczenia
                  </div>
                  <div className="text-lg font-bold text-amber-600">
                    {formatCurrency(remainingToSettle)}
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-col justify-center">
                  <div className="text-[10px] text-slate-500 uppercase mb-1 font-bold">
                    Koszty
                  </div>
                  <div className="text-lg font-bold text-red-600">
                    {formatCurrency(currentTotalCosts)}
                  </div>
                </div>
                <div
                  className={`bg-white rounded-xl shadow-sm border p-4 flex flex-col justify-center ${
                    currentProfit < 0
                      ? "border-b-4 border-b-red-500"
                      : "border-b-4 border-b-emerald-500"
                  }`}
                >
                  <div className="text-[10px] text-slate-500 uppercase mb-1 font-bold">
                    Zysk
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      currentProfit < 0 ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {formatCurrency(currentProfit)}
                  </div>
                </div>
              </div>

              {/* Sekcja: Transze / Etapy rozliczeniowe */}
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-blue-500" /> Etapy
                  rozliczeniowe (Wpłaty)
                </h3>
                {canEditTab("finanse") && (
                  <div className="flex flex-col md:flex-row gap-3 mb-4">
                    <input
                      type="text"
                      placeholder="Nazwa etapu (np. Stan zero, Dach)"
                      value={newInstTitle}
                      onChange={(e) => setNewInstTitle(e.target.value)}
                      className="flex-1 bg-slate-50 border rounded-lg p-2.5 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Kwota (PLN)"
                      value={newInstAmount}
                      onChange={(e) => setNewInstAmount(e.target.value)}
                      className="w-full md:w-32 bg-slate-50 border rounded-lg p-2.5 text-sm"
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
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold px-4 py-2.5 shadow-sm"
                    >
                      Dodaj etap
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {projInstallments.length === 0 && (
                    <p className="text-center text-slate-400 py-4 text-sm">
                      Brak zdefiniowanych etapów rozliczeniowych.
                    </p>
                  )}
                  {projInstallments.map((inst) => {
                    const isEditing = editingInstId === inst.id;
                    return (
                      <div
                        key={inst.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-3 border rounded-lg bg-slate-50 gap-3"
                      >
                        {isEditing ? (
                          <div className="flex-1 flex gap-2 w-full">
                            <input
                              type="text"
                              value={editInstTitle}
                              onChange={(e) => setEditInstTitle(e.target.value)}
                              className="flex-1 border rounded p-1.5 text-sm"
                            />
                            <input
                              type="number"
                              value={editInstAmount}
                              onChange={(e) =>
                                setEditInstAmount(e.target.value)
                              }
                              className="w-24 border rounded p-1.5 text-sm"
                            />
                            <button
                              onClick={() => {
                                genericUpdate("ins_installments", inst.id, {
                                  title: editInstTitle,
                                  amount: parseFloat(editInstAmount) || 0,
                                });
                                setEditingInstId(null);
                              }}
                              className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold"
                            >
                              Zapisz
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 flex-1">
                            <label
                              className="flex items-center cursor-pointer gap-2"
                              title="Oznacz jako zapłacone"
                            >
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
                                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                              />
                            </label>
                            <span
                              className={`text-sm font-medium ${
                                inst.isPaid
                                  ? "text-slate-400 line-through"
                                  : "text-slate-700"
                              }`}
                            >
                              {inst.title}
                            </span>
                            <span
                              className={`text-sm font-bold ml-auto ${
                                inst.isPaid ? "text-slate-400" : "text-blue-600"
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
                              className="text-blue-500 hover:text-blue-700 p-1"
                            >
                              <EditIcon className="w-4 h-4" />
                            </button>
                            <Trash2
                              className="w-4 h-4 text-slate-300 cursor-pointer hover:text-red-500"
                              onClick={() =>
                                genericDel("ins_installments", inst.id)
                              }
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {currentTotalCosts > 0 && (
                <div className="bg-white rounded-xl shadow-sm border p-5 flex flex-col md:flex-row items-center gap-6">
                  <div
                    className="w-32 h-32 rounded-full border-4 border-white shadow-md flex-shrink-0"
                    style={{
                      background: `conic-gradient(${COST_CATEGORIES.map(
                        (cat, i) => {
                          const catTotal = projCosts
                            .filter((c) => c.category === cat)
                            .reduce((a, b) => a + (b.amount || 0), 0);
                          const percent =
                            currentTotalCosts > 0
                              ? (catTotal / currentTotalCosts) * 100
                              : 0;
                          const start = COST_CATEGORIES.slice(0, i).reduce(
                            (acc, c) =>
                              acc +
                              (projCosts
                                .filter((cx) => cx.category === c)
                                .reduce((a, b) => a + (b.amount || 0), 0) /
                                currentTotalCosts) *
                                100,
                            0
                          );
                          return `${
                            [
                              "#3b82f6",
                              "#ef4444",
                              "#f59e0b",
                              "#8b5cf6",
                              "#10b981",
                            ][i]
                          } ${start}% ${start + percent}%`;
                        }
                      ).join(", ")})`,
                    }}
                  ></div>
                  <div className="flex-1 w-full space-y-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 border-b pb-2">
                      Zestawienie całkowite wg kategorii
                    </h3>
                    {COST_CATEGORIES.map((cat, i) => {
                      const catTotal = projCosts
                        .filter((c) => c.category === cat)
                        .reduce((a, b) => a + (b.amount || 0), 0);
                      if (catTotal === 0) return null;
                      const percent = Math.round(
                        (catTotal / currentTotalCosts) * 100
                      );
                      return (
                        <div
                          key={cat}
                          className="flex justify-between items-center text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: [
                                  "#3b82f6",
                                  "#ef4444",
                                  "#f59e0b",
                                  "#8b5cf6",
                                  "#10b981",
                                ][i],
                              }}
                            ></span>
                            {cat}
                          </div>
                          <div className="font-mono text-slate-700 font-bold">
                            {percent}%{" "}
                            <span className="text-xs text-slate-400 font-normal ml-2 w-20 inline-block text-right">
                              {formatCurrency(catTotal)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {canEditTab("finanse") && (
                <div className="bg-white rounded-xl shadow-sm border p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <input
                      type="date"
                      value={newCostDate}
                      onChange={(e) => setNewCostDate(e.target.value)}
                      className="bg-slate-50 border rounded-lg p-2.5 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Kwota (PLN)"
                      value={newCostAmount}
                      onChange={(e) => setNewCostAmount(e.target.value)}
                      className="bg-slate-50 border rounded-lg p-2.5 text-sm"
                    />
                    <select
                      value={newCostCategory}
                      onChange={(e) => setNewCostCategory(e.target.value)}
                      className="bg-slate-50 border rounded-lg p-2.5 text-sm col-span-2 md:col-span-1"
                    >
                      {COST_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Opis wydatku"
                      value={newCostDesc}
                      onChange={(e) => setNewCostDesc(e.target.value)}
                      className="col-span-2 md:col-span-2 bg-slate-50 border rounded-lg p-2.5 text-sm"
                    />
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
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold col-span-2 md:col-span-2 p-2.5 shadow-sm"
                    >
                      Zapisz koszt
                    </button>
                  </div>
                </div>
              )}
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b text-xs text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3">Data</th>
                      <th className="px-4 py-3 hidden md:table-cell">
                        Kategoria
                      </th>
                      <th className="px-4 py-3">Opis</th>
                      <th className="px-4 py-3 text-right">Kwota</th>
                      <th className="px-4 py-3 text-center print:hidden">
                        Akcje
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
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
                                  onChange={(e) =>
                                    setEditCostDesc(e.target.value)
                                  }
                                  className="border rounded p-1 text-xs"
                                  placeholder="Opis"
                                />
                                <input
                                  type="number"
                                  value={editCostAmount}
                                  onChange={(e) =>
                                    setEditCostAmount(e.target.value)
                                  }
                                  className="border rounded p-1 text-xs"
                                  placeholder="Kwota"
                                />
                                <select
                                  value={editCostCategory}
                                  onChange={(e) =>
                                    setEditCostCategory(e.target.value)
                                  }
                                  className="border rounded p-1 text-xs"
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
                                  className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold"
                                >
                                  Zapisz
                                </button>
                              </div>
                            </td>
                          ) : (
                            <>
                              <td className="px-4 py-3 font-mono text-xs">
                                {cost.date}
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">
                                {cost.category}
                              </td>
                              <td className="px-4 py-3">{cost.description}</td>
                              <td className="px-4 py-3 text-right font-bold text-red-600">
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
                                      className="text-blue-500 hover:text-blue-700 p-1"
                                    >
                                      <EditIcon className="w-4 h-4" />
                                    </button>
                                    <Trash2
                                      className="w-4 h-4 text-slate-300 cursor-pointer hover:text-red-500"
                                      onClick={() =>
                                        genericDel("ins_costs", cost.id)
                                      }
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
                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border print:hidden">
                  <div className="flex gap-2 flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Nowa nazwa etapu odbioru..."
                      value={newCategoryTitleInput}
                      onChange={(e) => setNewCategoryTitleInput(e.target.value)}
                      className="border rounded-lg p-2 text-sm flex-1"
                    />
                    <button
                      onClick={handleAddCategory}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Dodaj etap
                    </button>
                  </div>
                  <button
                    onClick={() => setIsEditingChecklist(!isEditingChecklist)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold shadow-sm border transition ${
                      isEditingChecklist
                        ? "bg-orange-100 text-orange-700 border-orange-300"
                        : "bg-white text-slate-600"
                    }`}
                  >
                    <SettingsIco className="w-4 h-4" />{" "}
                    {isEditingChecklist ? "Zakończ Edycję" : "Edytuj Listy"}
                  </button>
                </div>
              )}

              {Object.entries(currentChecklistTemplate).map(
                ([stage, items]) => {
                  const checked = (items || []).filter(
                    (_, i) => currentCState[`${stage}_${i}`]
                  ).length;
                  const prog = Math.round(
                    (checked / ((items || []).length || 1)) * 100
                  );
                  return (
                    <div
                      key={stage}
                      className="bg-white rounded-xl shadow-sm border overflow-hidden"
                    >
                      <div className="bg-slate-50 p-4 border-b">
                        <div className="flex justify-between items-center mb-2">
                          {isEditingChecklist && editingStageName === stage ? (
                            <div className="flex items-center gap-2 flex-1 mr-4">
                              <input
                                type="text"
                                value={newStageNameInput}
                                onChange={(e) =>
                                  setNewStageNameInput(e.target.value)
                                }
                                className="border rounded px-2 py-1 text-sm font-bold flex-1 bg-white"
                              />
                              <button
                                onClick={() => handleRenameStage(stage)}
                                className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold"
                              >
                                Zapisz
                              </button>
                              <button
                                onClick={() => setEditingStageName(null)}
                                className="bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs"
                              >
                                Anuluj
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-700">
                                {stage}
                              </span>
                              {isEditingChecklist && (
                                <button
                                  onClick={() => {
                                    setEditingStageName(stage);
                                    setNewStageNameInput(stage);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 p-1 print:hidden"
                                  title="Zmień nazwę etapu"
                                >
                                  <EditIcon className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                          <span className="text-xs bg-slate-200 px-2 py-1 rounded-full font-semibold">
                            {prog}%
                          </span>
                        </div>
                        <div className="bg-slate-200 h-1.5 rounded-full">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${prog}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="divide-y">
                        {(items || []).map((item, i) => (
                          <div
                            key={i}
                            className="p-4 flex items-start gap-3 hover:bg-slate-50 cursor-pointer relative group"
                            onClick={async () => {
                              if (
                                isEditingChecklist ||
                                !canEditTab("checklisty")
                              )
                                return;
                              const up = {
                                ...currentCState,
                                [`${stage}_${i}`]:
                                  !currentCState[`${stage}_${i}`],
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
                              {currentCState[`${stage}_${i}`] ? (
                                <CheckSquare className="w-5 h-5 text-green-500" />
                              ) : (
                                <Circle className="w-5 h-5 text-slate-300" />
                              )}
                            </div>
                            <span
                              className={`text-sm ${
                                currentCState[`${stage}_${i}`]
                                  ? "text-slate-400 line-through"
                                  : "text-slate-700"
                              } flex-1 pr-8`}
                            >
                              {item}
                            </span>
                            {isEditingChecklist && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updated = {
                                    ...currentChecklistTemplate,
                                  };
                                  updated[stage] = updated[stage].filter(
                                    (_, idx) => idx !== i
                                  );
                                  saveChecklistTemplate(updated);
                                }}
                                className="absolute right-3 top-4 text-red-400 hover:text-red-600 print:hidden"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        {isEditingChecklist && (
                          <div className="p-3 bg-slate-50 border-t flex gap-2 print:hidden">
                            <input
                              type="text"
                              placeholder="Dodaj nowy punkt do tego etapu..."
                              value={
                                newChecklistItemStage === stage
                                  ? newChecklistItemText
                                  : ""
                              }
                              onChange={(e) => {
                                setNewChecklistItemStage(stage);
                                setNewChecklistItemText(e.target.value);
                              }}
                              className="flex-1 text-sm p-2 border rounded bg-white"
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
                              className="bg-slate-800 text-white px-4 rounded text-sm font-bold"
                            >
                              Dodaj
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}

          {/* ZDJĘCIA */}
          {activeTab === "zdjecia" && (
            <div className="space-y-6 animate-in fade-in">
              {canEditTab("zdjecia") && (
                <div className="bg-white rounded-xl shadow-sm border p-6 text-center flex flex-col gap-3 print:hidden">
                  <input
                    type="text"
                    placeholder="Krótki opis (opcjonalny)"
                    value={photoDesc}
                    onChange={(e) => setPhotoDesc(e.target.value)}
                    className="bg-slate-50 border p-2 rounded-lg text-sm max-w-sm mx-auto w-full"
                  />

                  {/* Wybieranie zdjęć bez wymuszania aparatu na wszystkich urządzeniach */}
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
                    className="bg-slate-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2 max-w-sm mx-auto w-full"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />{" "}
                        Przetwarzanie...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" /> Zrób / Wgraj Zdjęcie
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
                      className="bg-white rounded-xl border overflow-hidden relative group"
                    >
                      <div className="aspect-[4/3] relative">
                        <img
                          src={photo.imageBase64}
                          className="w-full h-full object-cover"
                          alt="foto"
                        />
                        {canEditTab("zdjecia") && (
                          <button
                            onClick={() => genericDel("ins_photos", photo.id)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-md opacity-80 print:hidden"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {photo.description && (
                        <div className="p-2 text-[10px] text-slate-600 bg-slate-50 border-t truncate">
                          {photo.description}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ZADANIA / DO ZROBIENIA (DELEGOWANIE) */}
          {activeTab === "zadania" && (
            <div className="space-y-6 animate-in fade-in">
              {canEditTab("zadania") && (
                <div className="bg-white rounded-xl shadow-sm border p-4 border-t-4 border-t-indigo-600 print:hidden">
                  <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-indigo-600" /> Deleguj
                    zadanie pracownikowi / wykonawcy
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Tytuł / Nazwa zadania"
                      value={newDelegationTitle}
                      onChange={(e) => setNewDelegationTitle(e.target.value)}
                      className="border rounded-lg p-2.5 text-sm bg-slate-50"
                    />
                    <select
                      value={newDelegationAssignee}
                      onChange={(e) => setNewDelegationAssignee(e.target.value)}
                      className="border rounded-lg p-2.5 text-sm bg-slate-50 font-bold"
                    >
                      <option value="">
                        Wybierz wykonawcę / pracownika...
                      </option>
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
                  </div>
                  <div className="mb-3">
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Termin wykonania (opcjonalny):
                    </label>
                    <input
                      type="date"
                      value={newDelegationDeadline}
                      onChange={(e) => setNewDelegationDeadline(e.target.value)}
                      className="border rounded-lg p-2.5 text-sm bg-slate-50 w-full md:w-auto"
                    />
                  </div>
                  <textarea
                    placeholder="Szczegółowy opis polecenia..."
                    value={newDelegationDesc}
                    onChange={(e) => setNewDelegationDesc(e.target.value)}
                    className="w-full border rounded-lg p-3 text-sm bg-slate-50 min-h-[70px] mb-3"
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
                    disabled={
                      !newDelegationTitle.trim() || !newDelegationAssignee
                    }
                    className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-bold shadow-sm"
                  >
                    Zleć zadanie
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {projDelegations.length === 0 && (
                  <p className="text-center text-slate-400 py-8">
                    Brak zleconych zadań.
                  </p>
                )}
                {projDelegations.map((del) => {
                  const isAssignedToMe = del.assignee === user.email;
                  const canManageDelegation =
                    isAdministrator || del.assigner === user.email;

                  return (
                    <div
                      key={del.id}
                      className="bg-white rounded-xl shadow-sm border p-5 relative border-l-4 border-l-indigo-500 space-y-3"
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
                            Zlecone dla:{" "}
                            <strong className="text-slate-800">
                              {getShortUserName(del.assignee)}
                            </strong>{" "}
                            (od: {getShortUserName(del.assigner)})
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                            del.status === "Zatwierdzone"
                              ? "bg-green-100 text-green-700"
                              : del.status === "Wykonane"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {del.status}
                        </span>
                      </div>

                      {del.description && (
                        <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                          {del.description}
                        </p>
                      )}
                      {del.deadline && (
                        <p className="text-xs font-mono text-slate-500">
                          Termin: {del.deadline}
                        </p>
                      )}

                      {del.workerNote && (
                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-900">
                          <strong>Notatki wykonawcy:</strong> {del.workerNote}
                        </div>
                      )}

                      {del.adminNote && (
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs text-blue-900">
                          <strong>Odpowiedź nadzoru:</strong> {del.adminNote}
                        </div>
                      )}

                      {/* Odpowiedź wykonawcy / pracownika (Zapis notatki + Zmiana statusu osobno) */}
                      {isAssignedToMe && del.status !== "Zatwierdzone" && (
                        <div className="pt-3 border-t space-y-2 print:hidden">
                          <input
                            type="text"
                            placeholder="Wpisz notatkę (np. powód opóźnienia, pytanie)..."
                            id={`w_note_${del.id}`}
                            defaultValue={del.workerNote || ""}
                            className="border rounded p-2 text-xs w-full bg-slate-50"
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => {
                                const val = document.getElementById(
                                  `w_note_${del.id}`
                                ).value;
                                genericUpdate("ins_delegations", del.id, {
                                  workerNote: val,
                                });
                              }}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-1.5 rounded text-xs font-bold transition"
                            >
                              Zapisz notatkę (bez zmiany statusu)
                            </button>

                            {del.status !== "Wykonane" && (
                              <button
                                onClick={() => {
                                  const val = document.getElementById(
                                    `w_note_${del.id}`
                                  ).value;
                                  genericUpdate("ins_delegations", del.id, {
                                    status: "Wykonane",
                                    workerNote: val,
                                  });
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-xs font-bold transition"
                              >
                                Oznacz jako wykonane
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Zatwierdzenie i odpowiedź przez zleceniodawcę / admina */}
                      {canManageDelegation && (
                        <div className="pt-3 border-t space-y-2 print:hidden">
                          <input
                            type="text"
                            placeholder="Wpisz odpowiedź lub uwagę do wykonawcy..."
                            id={`a_note_${del.id}`}
                            defaultValue={del.adminNote || ""}
                            className="border rounded p-2 text-xs w-full bg-slate-50"
                          />
                          <div className="flex flex-wrap justify-between gap-2">
                            <button
                              onClick={() => {
                                const val = document.getElementById(
                                  `a_note_${del.id}`
                                ).value;
                                genericUpdate("ins_delegations", del.id, {
                                  adminNote: val,
                                });
                              }}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-1.5 rounded text-xs font-bold transition"
                            >
                              Zapisz odpowiedź
                            </button>

                            {del.status === "Wykonane" && (
                              <button
                                onClick={() =>
                                  genericUpdate("ins_delegations", del.id, {
                                    status: "Zatwierdzone",
                                  })
                                }
                                className="bg-green-600 text-white px-4 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />{" "}
                                Zatwierdź zadanie
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

          {/* RAPORTY */}
          {activeTab === "raporty" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white rounded-xl shadow-sm border p-6 text-center border-t-4 border-t-blue-600 print:hidden">
                <FileText className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Moduł Raportów</h2>
                <p className="text-sm text-slate-500 mb-6">
                  Wybierz zakres dat oraz elementy, które chcesz umieścić w PDF.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  {["tydzien", "miesiac", "kwartal", "rok"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setReportPeriod(p)}
                      className={`py-2 text-xs font-bold rounded-lg border uppercase ${
                        reportPeriod === p
                          ? "bg-blue-50 border-blue-500 text-blue-700"
                          : "bg-white text-slate-500"
                      }`}
                    >
                      {p === "tydzien"
                        ? "Ten Tydzień"
                        : p === "miesiac"
                        ? "Miesiąc"
                        : p === "kwartal"
                        ? "Kwartał"
                        : "Rok"}
                    </button>
                  ))}
                </div>

                <div className="flex gap-4 items-center justify-center mb-6">
                  <span className="text-xs font-bold text-slate-400">LUB</span>
                  <input
                    type="date"
                    value={reportDateFrom}
                    onChange={(e) => {
                      setReportDateFrom(e.target.value);
                      setReportPeriod("custom");
                    }}
                    className="border rounded-md p-1.5 text-sm"
                  />
                  <span className="text-sm">-</span>
                  <input
                    type="date"
                    value={reportDateTo}
                    onChange={(e) => {
                      setReportDateTo(e.target.value);
                      setReportPeriod("custom");
                    }}
                    className="border rounded-md p-1.5 text-sm"
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border text-left mb-6 space-y-3">
                  <h3 className="font-bold text-sm text-slate-700 mb-2 border-b pb-2">
                    Zawartość dokumentu:
                  </h3>
                  {[
                    { id: "logs", label: "Wpisy z Dziennika Budowy" },
                    {
                      id: "agreementsInwestor",
                      label: "Ustalenia z Inwestorem",
                    },
                    { id: "agreementsBudowa", label: "Ustalenia na Budowie" },
                    { id: "agreementsRada", label: "Rady Budowy" },
                    {
                      id: "budget",
                      label: "Ogólne realizacja budżetu (Wykres)",
                    },
                    {
                      id: "checklists",
                      label: "Odbiory (zakończone czynności)",
                    },
                    { id: "photos", label: "Zdjęcia i opisy sytuacji" },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className="flex items-center gap-3 cursor-pointer"
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
                        className="w-4 h-4 text-blue-600 rounded border-slate-300"
                      />
                      <span className="text-sm text-slate-600">
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>

                <button
                  onClick={() => setShowReportPreview(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider w-full shadow-lg"
                >
                  Generuj Podgląd PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
