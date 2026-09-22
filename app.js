const SUPABASE_URL="https://mpanymikmqajpppipmxy.supabase.co";
const SUPABASE_ANON_KEY="sb_publishable_gFcCXJ4jzWl4P8CDBi-uhQ_Gkr1EHa4";
const db=supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);

const ADMIN_EMAIL="azizsolo.190@gmail.com";
const MASTER_ADMIN_EMAIL=ADMIN_EMAIL;

let currentUser=null,isAdmin=false,products=[],workers=[],equipment=[],metrology=[],movements=[],users=[],movementType="entry",deferredPrompt=null;

function todayKey(){return new Date().toISOString().slice(0,10)}
function formatDate(d){if(!d)return "-";return new Date(d+"T00:00:00").toLocaleDateString("ar-DZ")}
function addMonths(s,n){const d=new Date(s+"T00:00:00");d.setMonth(d.getMonth()+n);return d.toISOString().slice(0,10)}
function addDays(s,n){const d=new Date(s+"T00:00:00");d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)}

function safe(v){
  return String(v??"")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/\"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

function errText(e){
  return e?.message||e?.error_description||"خطأ غير معروف";
}

function toast(m){
  const e=document.getElementById("toast");
  if(!e)return;
  e.textContent=m;
  e.classList.add("show");
  clearTimeout(window.__toast);
  window.__toast=setTimeout(()=>e.classList.remove("show"),3000);
}

function showLogin(){
  document.getElementById("loginScreen").style.display="flex";
  document.getElementById("app").style.display="none";
}

function isMasterAdmin(){
  return String(currentUser?.email||"").toLowerCase()===MASTER_ADMIN_EMAIL.toLowerCase();
}

function showApp(){
  document.getElementById("loginScreen").style.display="none";
  document.getElementById("app").style.display="block";

  const se=document.getElementById("settingsEmail");
  if(se)se.textContent=currentUser?.email||"";

  const ls=document.getElementById("languageSelect");
  if(ls)ls.value=currentLanguage;

  updateInstallButton();
  changeLanguage(currentLanguage);

  const adminNav=document.getElementById("adminNav");
  if(adminNav)adminNav.classList.toggle("show",isMasterAdmin());
}

function showLoginError(m){
  const e=document.getElementById("loginError");
  if(!e)return;
  e.textContent=m;
  e.style.display="block";
}

function togglePassword(){
  const e=document.getElementById("loginPassword");
  const i=document.getElementById("passwordEye");
  if(!e)return;

  e.type=e.type==="password"?"text":"password";
  if(i)i.textContent=e.type==="password"?"👁️":"🙈";
}

async function getProfile(user){
  const {data,error}=await db
    .from("profiles")
    .select("*")
    .eq("id",user.id)
    .maybeSingle();

  if(error){
    console.warn("profiles:",error.message);
    return null;
  }

  return data;
}

async function applyUser(user){
  currentUser=user;

  const p=await getProfile(user);

  const temporaryExpired=
    p?.blocked_until &&
    new Date(p.blocked_until).getTime()<=Date.now();

  if(temporaryExpired&&p?.is_blocked===true){
    await db
      .from("profiles")
      .update({
        is_blocked:false,
        blocked_until:null
      })
      .eq("id",user.id);

    p.is_blocked=false;
  }

  isAdmin=
    user.email?.toLowerCase()===ADMIN_EMAIL.toLowerCase()||
    p?.role==="admin";

  if(p?.is_blocked===true||p?.blocked===true){
    await db.auth.signOut();

    currentUser=null;
    isAdmin=false;

    showLogin();

    showLoginError(
      p?.blocked_until
      ?"هذا الحساب موقوف مؤقتًا من طرف الإدارة."
      :"هذا الحساب محظور من طرف الإدارة."
    );

    return false;
  }

  showApp();

  if(isAdmin)setTimeout(loadUsers,100);

  return true;
}

let currentLanguage=
  localStorage.getItem("stockpro_language")||"ar";

const I18N={
  ar:{
    home:"الرئيسية",
    products:"المنتجات",
    workers:"العمال",
    equipment:"التجهيزات",
    duePage:"المستحقون",
    reports:"التقارير",
    settings:"الإعدادات",
    users:"إدارة المستخدمين",
    welcome:"مرحباً بك 👋",
    headerTitle:"إدارة المخزون والعمال والتجهيزات",
    quick:"العمليات السريعة",
    addProduct:"إضافة منتج",
    newMaterial:"مادة جديدة",
    stockIn:"دخول المخزون",
    stockOut:"خروج المخزون",
    bonIn:"Bon d'entrée",
    bonOut:"Bon de sortie",
    issueEquipment:"تسليم تجهيز",
    epi:"EPI / Vêtements",
    latestProducts:"آخر المنتجات",
    showAll:"عرض الكل",
    searchProduct:"ابحث عن منتج أو مرجع...",
    searchWorker:"ابحث بالـ Matricule أو الاسم...",
    searchEquipment:"ابحث بالـ Matricule أو اسم العامل...",
    searchDue:"ابحث بالـ Matricule أو اسم العامل...",
    searchUser:"بحث بالاسم...",
    add:"+ إضافة",
    workerAdd:"+ عامل",
    issueAdd:"+ تسليم",
    refresh:"↻ تحديث",
    quantity:"الكمية",
    category:"الفئة",
    reference:"المرجع",
    lastIssue:"آخر تسليم",
    dueDate:"تاريخ الاستحقاق",
    due:"مستحق",
    notDue:"غير مستحق",
    soon:"قريب من الاستحقاق",
    notIssued:"لم يُسلّم",
    remaining:"باقي",
    month:"شهر",
    months:"أشهر",
    day:"يوم",
    days:"أيام",
    today:"مستحق اليوم",
    overdue:"متأخر",
    developer:"المطور",
    account:"👤 الحساب",
    logout:"🚪 تسجيل الخروج",
    language:"لغة التطبيق",
    currentAccount:"الحساب الحالي",
    developerTitle:"👨‍💻 المطور",
    active:"نشط",
    inactive:"غير نشط",
    admin:"ADMIN",
    worker:"WORKER",
    blocked:"موقوف",
    noData:"لا توجد بيانات.",
    noProducts:"لا توجد منتجات.",
    noWorkers:"لا يوجد عمال.",
    noEquipment:"لا توجد بيانات تجهيزات.",
    noDue:"لا توجد استحقاقات حالياً."
  },

  fr:{
    home:"Accueil",
    products:"Articles",
    workers:"Travailleurs",
    equipment:"Équipements",
    duePage:"Éligibilités",
    reports:"Rapports",
    settings:"Paramètres",
    users:"Gestion des utilisateurs",
    welcome:"Bienvenue 👋",
    headerTitle:"Gestion du stock, des travailleurs et des équipements",
    quick:"Actions rapides",
    addProduct:"Ajouter un article",
    newMaterial:"Nouvelle matière",
    stockIn:"Entrée stock",
    stockOut:"Sortie stock",
    bonIn:"Bon d'entrée",
    bonOut:"Bon de sortie",
    issueEquipment:"Remise équipement",
    epi:"EPI / Vêtements",
    latestProducts:"Derniers articles",
    showAll:"Tout afficher",
    searchProduct:"Rechercher un article ou une référence...",
    searchWorker:"Rechercher par matricule ou nom...",
    searchEquipment:"Rechercher par matricule ou nom...",
    searchDue:"Rechercher par matricule ou nom...",
    searchUser:"Rechercher par nom...",
    add:"+ Ajouter",
    workerAdd:"+ Travailleur",
    issueAdd:"+ Remise",
    refresh:"↻ Actualiser",
    quantity:"Quantité",
    category:"Famille",
    reference:"Référence",
    lastIssue:"Dernière remise",
    dueDate:"Date d'échéance",
    due:"Éligible",
    notDue:"Non éligible",
    soon:"Échéance proche",
    notIssued:"Non remis",
    remaining:"Reste",
    month:"mois",
    months:"mois",
    day:"jour",
    days:"jours",
    today:"Éligible aujourd'hui",
    overdue:"En retard",
    developer:"Développeur",
    account:"👤 Compte",
    logout:"🚪 Déconnexion",
    language:"Langue de l'application",
    currentAccount:"Compte actuel",
    developerTitle:"👨‍💻 Développeur",
    active:"Actif",
    inactive:"Inactif",
    admin:"ADMIN",
    worker:"TRAVAILLEUR",
    blocked:"Suspendu",
    noData:"Aucune donnée.",
    noProducts:"Aucun article.",
    noWorkers:"Aucun travailleur.",
    noEquipment:"Aucun équipement.",
    noDue:"Aucune échéance actuellement."
  },

  en:{
    home:"Home",
    products:"Products",
    workers:"Workers",
    equipment:"Equipment",
    duePage:"Due items",
    reports:"Reports",
    settings:"Settings",
    users:"User management",
    welcome:"Welcome 👋",
    headerTitle:"Stock, workers and equipment management",
    quick:"Quick actions",
    addProduct:"Add product",
    newMaterial:"New material",
    stockIn:"Stock entry",
    stockOut:"Stock exit",
    bonIn:"Entry voucher",
    bonOut:"Exit voucher",
    issueEquipment:"Issue equipment",
    epi:"PPE / Clothing",
    latestProducts:"Latest products",
    showAll:"Show all",
    searchProduct:"Search product or reference...",
    searchWorker:"Search by matricule or name...",
    searchEquipment:"Search by matricule or worker name...",
    searchDue:"Search by matricule or worker name...",
    searchUser:"Search by name...",
    add:"+ Add",
    workerAdd:"+ Worker",
    issueAdd:"+ Issue",
    refresh:"↻ Refresh",
    quantity:"Quantity",
    category:"Family",
    reference:"Reference",
    lastIssue:"Last issue",
    dueDate:"Due date",
    due:"Due",
    notDue:"Not due",
    soon:"Due soon",
    notIssued:"Not issued",
    remaining:"
     function changeLanguage(lang){
  if(!I18N[lang])lang="ar";

  currentLanguage=lang;
  localStorage.setItem("stockpro_language",lang);

  document.documentElement.lang=lang;
  document.documentElement.dir=lang==="ar"?"rtl":"ltr";

  translateApp();

  const ls=document.getElementById("languageSelect");
  if(ls)ls.value=lang;

  renderProducts();
  renderWorkers();
  renderEquipment();
  renderDue();
  renderMovements();
  renderUsers();
}

function openModal(id){
  const e=document.getElementById(id);
  if(e)e.classList.add("show");
}

function closeModal(id){
  const e=document.getElementById(id);
  if(e)e.classList.remove("show");
}

function closeAllModals(){
  document.querySelectorAll(".modal").forEach(e=>{
    e.classList.remove("show");
  });
}

function go(page){
  document.querySelectorAll(".page").forEach(e=>{
    e.classList.remove("active");
  });

  document.querySelectorAll(".nav-item").forEach(e=>{
    e.classList.remove("active");
  });

  const p=document.getElementById("page-"+page);

  if(p)p.classList.add("active");

  const nav=document.querySelector(
    `.nav-item[data-page="${page}"]`
  );

  if(nav)nav.classList.add("active");

  if(page==="home"){
    loadProducts();
    loadWorkers();
    loadEquipment();
    loadMovements();
  }

  if(page==="products")
    loadProducts();

  if(page==="workers")
    loadWorkers();

  if(page==="equipment")
    loadEquipment();

  if(page==="due"){
    loadWorkers();
    loadEquipment();
  }

  if(page==="reports"){
    loadMovements();
    loadProducts();
  }

  if(page==="admin"&&is
     /* =========================
   EQUIPMENT
========================= */

const EQUIPMENT_TYPES=[
  {
    key:"shoes",
    label:"حذاء حماية",
    cycle:12,
    unit:"months"
  },
  {
    key:"bleu",
    label:"Bleu de travail",
    cycle:6,
    unit:"months"
  },
  {
    key:"glasses",
    label:"نظارات حماية",
    cycle:6,
    unit:"months"
  },
  {
    key:"gants",
    label:"قفازات",
    cycle:35,
    unit:"days"
  },
  {
    key:"vest_soudeur",
    label:"سترة لحام",
    cycle:6,
    unit:"months"
  }
];

function getEquipmentType(key){
  return EQUIPMENT_TYPES.find(
    x=>x.key===key
  );
}

function calculateDueDate(issueDate,type){
  if(!issueDate||!type)return null;

  if(type.unit==="days")
    return addDays(issueDate,type.cycle);

  return addMonths(issueDate,type.cycle);
}

async function loadEquipment(){
  if(!currentUser){
    equipment=[];
    renderEquipment();
    renderDue();
    return false;
  }

  const {data,error}=await db
    .from("equipment")
    .select("*")
    .eq("user_id",currentUser.id)
    .order("issue_date",{ascending:false});

  if(error){
    console.error("❌ تحميل التجهيزات:",error);
    toast("خطأ في تحميل التجهيزات ❌: "+errText(error));
    return false;
  }

  equipment=Array.isArray(data)?data:[];

  renderEquipment();
  renderDue();

  return true;
}

function getEquipmentWorker(id){
  return workers.find(
    w=>String(w.id)===String(id)
  );
}

function getEquipmentStatus(dueDate){
  if(!dueDate)
    return "notIssued";

  const diff=dueDiffDays(dueDate);

  if(diff<=0)
    return "due";

  if(diff<=30)
    return "soon";

  return "notdue";
}

function renderEquipment(){
  const box=document.getElementById("equipmentList");
  if(!box)return;

  const search=
    document.getElementById("equipmentSearch")
      ?.value.trim().toLowerCase()||"";

  const list=equipment.filter(e=>{
    const w=getEquipmentWorker(e.worker_id);

    return !search||
      String(w?.name||"")
        .toLowerCase()
        .includes(search)||
      String(w?.matricule||"")
        .toLowerCase()
        .includes(search)||
      String(e.type||"")
        .toLowerCase()
        .includes(search);
  });

  if(!list.length){
    box.innerHTML=`
      <div class="empty">
        ${tr("noEquipment")}
      </div>
    `;
    return;
  }

  box.innerHTML=list.map(e=>{

    const w=getEquipmentWorker(e.worker_id);

    const status=getEquipmentStatus(
      e.due_date
    );

    return `
      <div class="data-card">

        <div class="data-main">

          <strong>
            ${safe(
              w?.name||
              "عامل غير موجود"
            )}
          </strong>

          <small>
            Matricule:
            ${safe(w?.matricule||"-")}
          </small>

          <small>
            ${safe(
              equipmentLabel(e.type)
            )}
          </small>

        </div>

        <div class="data-main">

          <small>
            ${tr("lastIssue")}:
            ${formatDate(e.issue_date)}
          </small>

          <small>
            ${tr("dueDate")}:
            ${formatDate(e.due_date)}
          </small>

          <small>
            ${remainingText(e.due_date)}
          </small>

        </div>

        <div>
          <span class="badge ${
            status==="due"
            ?"danger"
            :status==="soon"
            ?"warning"
            :"success"
          }">
            ${statusText(status)}
          </span>
        </div>

        <div class="data-actions">

          <button
            class="btn btn-danger"
            onclick="deleteEquipment('${safe(e.id)}')">
            🗑️
          </button>

        </div>

      </div>
    `;
  }).join("");
}

function renderDue(){
  const box=document.getElementById("dueList");
  if(!box)return;

  const search=
    document.getElementById("dueSearch")
      ?.value.trim().toLowerCase()||"";

  const list=equipment
    .filter(e=>{
      const status=getEquipmentStatus(
        e.due_date
      );

      return status==="due"||
             status==="soon";
    })
    .filter(e=>{
      const w=getEquipmentWorker(e.worker_id);

      return !search||
        String(w?.name||"")
          .toLowerCase()
          .includes(search)||
        String(w?.matricule||"")
          .toLowerCase()
          .includes(search)||
        String(e.type||"")
          .toLowerCase()
          .includes(search);
    })
    .sort((a,b)=>{
      return String(a.due_date||"")
        .localeCompare(
          String(b.due_date||"")
        );
    });

  if(!list.length){
    box.innerHTML=`
      <div class="empty">
        ${tr("noDue")}
      </div>
    `;
    return;
  }

  box.innerHTML=list.map(e=>{

    const w=getEquipmentWorker(e.worker_id);

    const status=getEquipmentStatus(
      e.due_date
    );

    return `
      <div class="data-card">

        <div class="data-main">

          <strong>
            ${safe(w?.name||"-")}
          </strong>

          <small>
            Matricule:
            ${safe(w?.matricule||"-")}
          </small>

          <small>
            ${safe(
              equipmentLabel(e.type)
            )}
          </small>

        </div>

        <div class="data-main">

          <small>
            ${tr("dueDate")}:
            ${formatDate(e.due_date)}
          </small>

          <strong>
            ${remainingText(e.due_date)}
          </strong>

        </div>

        <span class="badge ${
          status==="due"
          ?"danger"
          :"warning"
        }">
          ${statusText(status)}
        </span>

      </div>
    `;
  }).join("");
}

async function saveEquipment(e){
  if(e)e.preventDefault();

  if(!currentUser)
    return toast("يجب تسجيل الدخول أولاً ❌");

  const workerId=
    document.getElementById("equipmentWorker")
      ?.value||"";

  const type=
    document.getElementById("equipmentType")
      ?.value||"";

  const issueDate=
    document.getElementById("equipmentIssueDate")
      ?.value||todayKey();

  if(!workerId)
    return toast("اختر العامل ❌");

  if(!type)
    return toast("اختر نوع التجهيز ❌");

  const et=getEquipmentType(type);

  if(!et)
    return toast("نوع التجهيز غير صحيح ❌");

  const dueDate=
    calculateDueDate(
      issueDate,
      et
    );

  const obj={
    user_id:currentUser.id,
    worker_id:workerId,
    type,
    issue_date:issueDate,
    due_date:dueDate
  };

  const {data,error}=await db
    .from("equipment")
    .insert(obj)
    .select("*")
    .single();

  if(error){
    console.error(
      "❌ إضافة التجهيز:",
      error
    );

    return toast(
      "تعذر إضافة التجهيز: "+
      errText(error)
    );
  }

  if(data){
    equipment=[
      data,
      ...equipment.filter(
        x=>String(x.id)!==
           String(data.id)
      )
    ];
  }

  renderEquipment();
  renderDue();

  closeModal("equipmentModal");

  const w=
    document.getElementById(
      "equipmentWorker"
    );

  const t=
    document.getElementById(
      "equipmentType"
    );

  const d=
    document.getElementById(
      "equipmentIssueDate"
    );

  if(w)w.value="";
  if(t)t.value="";
  if(d)d.value=todayKey();

  await loadEquipment();

  toast(
    "تم تسجيل التجهيز بنجاح ✅"
  );
}

async function deleteEquipment(id){
  if(!currentUser)return;

  if(!confirm(
    "هل تريد حذف هذا التسليم؟"
  ))
    return;

  const {error}=await db
    .from("equipment")
    .delete()
    .eq("id",id)
    .eq("user_id",currentUser.id);

  if(error){
    console.error(
      "❌ حذف التجهيز:",
      error
    );

    return toast(
      "تعذر حذف التجهيز: "+
      errText(error)
    );
  }

  equipment=equipment.filter(
    e=>String(e.id)!==
       String(id)
  );

  renderEquipment();
  renderDue();

  toast("تم حذف التسليم ✅");
}


/* =========================
   METROLOGY
========================= */

async function loadMetrology(){
  if(!currentUser){
    metrology=[];
    renderMetrology();
    return false;
  }

  const {data,error}=await db
    .from("metrology")
    .select("*")
    .eq("user_id",currentUser.id)
    .order(
      "calibration_end",
      {ascending:true}
    );

  if(error){
    console.error(
      "❌ تحميل المترولوجيا:",
      error
    );

    toast(
      "خطأ في تحميل الطالوناج ❌"
    );

    return false;
  }

  metrology=Array.isArray(data)?data:[];

  renderMetrology();

  return true;
}

function metrologyRemaining(date){
  if(!date)
    return tr("notIssued");

  const diff=dueDiffDays(date);

  if(diff<=0){
    return diff===0
      ?tr("today")
      :`${tr("overdue")} ${Math.abs(diff)} ${tr("days")}`;
  }

  const months=Math.floor(
    diff/30
  );

  const days=diff%30;

  const parts=[];

  if(months>0){
    parts.push(
      `${months} ${
        months===1
        ?tr("month")
        :tr("months")
      }`
    );
  }

  if(days>0){
    parts.push(
      `${days} ${
        days===1
        ?tr("day")
        :tr("days")
      }`
    );
  }

  return `${tr("remaining")} ${parts.join(
    currentLanguage==="ar"?" و ":" "
  )}`;
}

function renderMetrology(){
  const box=document.getElementById(
    "metrologyList"
  );

  if(!box)return;

  if(!metrology.length){
    box.innerHTML=`
      <div class="empty">
        ${tr("noData")}
      </div>
    `;
    return;
  }

  box.innerHTML=metrology.map(m=>{

    const diff=dueDiffDays(
      m.calibration_end
    );

    const status=
      diff<=0
      ?"danger"
      :diff<=30
      ?"warning"
      :"success";

    return `
      <div class="data-card">

        <div class="data-main">

          <strong>
            ${safe(m.equipment_name||"-")}
          </strong>

          <small>
            ${safe(m.equipment_ref||"-")}
          </small>

          <small>
            ${safe(m.description||"")}
          </small>

        </div>

        <div class="data-main">

          <small>
            تاريخ الطالوناج:
            ${formatDate(m.calibration_date)}
          </small>

          <small>
            نهاية الطالوناج:
            ${formatDate(m.calibration_end)}
          </small>

          <strong>
            ${metrologyRemaining(
              m.calibration_end
            )}
          </strong>

        </div>

        <span class="badge ${status}">
          ${
            diff<=0
            ?tr("overdue")
            :diff<=30
            ?tr("soon")
            :tr("active")
          }
        </span>

        <div class="data-actions">

          <button
            class="btn btn-danger"
            onclick="deleteMetrology('${safe(m.id)}')">
            🗑️
          </button>

        </div>

      </div>
    `;
  }).join("");
}

async function saveMetrology(e){
  if(e)e.preventDefault();

  if(!currentUser)
    return toast(
      "يجب تسجيل الدخول أولاً ❌"
    );

  const equipmentName=
    document.getElementById(
      "metrologyEquipmentName"
    )?.value.trim()||"";

  const equipmentRef=
    document.getElementById(
      "metrologyEquipmentRef"
    )?.value.trim()||"";

  const description=
    document.getElementById(
      "metrologyDescription"
    )?.value.trim()||"";

  const calibrationDate=
    document.getElementById(
      "calibrationDate"
    )?.value||"";

  const period=
    Number(
      document.getElementById(
        "calibrationPeriod"
      )?.value||12
    );

  const periodUnit=
    document.getElementById(
      "calibrationPeriodUnit"
    )?.value||"months";

  if(!equipmentName)
    return toast(
      "أدخل اسم جهاز القياس ❌"
    );

  if(!calibrationDate)
    return toast(
      "أدخل تاريخ الطالوناج ❌"
    );

  const calibrationEnd=
    periodUnit==="days"
    ?addDays(calibrationDate,period)
    :addMonths(calibrationDate,period);

  const obj={
    user_id:currentUser.id,
    equipment_name:equipmentName,
    equipment_ref:equipmentRef,
    description,
    calibration_date:calibrationDate,
    calibration_end:calibrationEnd
  };

  const {data,error}=await db
    .from("metrology")
    .insert(obj)
    .select("*")
    .single();

  if(error){
    console.error(
      "❌ إضافة الطالوناج:",
      error
    );

    return toast(
      "تعذر إضافة الطالوناج: "+
      errText(error)
    );
  }

  if(data){
    metrology=[
      data,
      ...metrology.filter(
        x=>String(x.id)!==
           String(data.id)
      )
    ];
  }

  renderMetrology();

  closeModal("metrologyModal");

  await loadMetrology();

  toast(
    "تم تسجيل الطالوناج بنجاح ✅"
  );
}

async function deleteMetrology(id){
  if(!currentUser)return;

  if(!confirm(
    "هل تريد حذف هذا الجهاز؟"
  ))
    return;

  const {error}=await db
    .from("metrology")
    .delete()
    .eq("id",id)
    .eq("user_id",currentUser.id);

  if(error){
    console.error(
      "❌ حذف الطالوناج:",
      error
    );

    return toast(
      "تعذر الحذف: "+
      errText(error)
    );
  }

  metrology=metrology.filter(
    x=>String(x.id)!==
       String(id)
  );

  renderMetrology();

  toast("تم الحذف ✅");
}


/* =========================
   MOVEMENTS
========================= */

async function loadMovements(){
  if(!currentUser){
    movements=[];
    renderMovements();
    return false;
  }

  const {data,error}=await db
    .from("movements")
    .select("*")
    .eq("user_id",currentUser.id)
    .order("created_at",{ascending:false});

  if(error){
    console.error(
      "❌ تحميل الحركات:",
      error
    );

    return false;
  }

  movements=Array.isArray(data)?data:[];

  renderMovements();

  return true;
}

function openMovement(productId,type){
  movementType=type;

  const select=
    document.getElementById(
      "movementProduct"
    );

  if(select){
    select.innerHTML=products.map(p=>`
      <option
        value="${safe(p.id)}"
        ${String(p.id)===String(productId)
          ?"selected"
          :""}>
        ${safe(p.name||"-")}
        ${
          p.reference
          ?" - "+safe(p.reference)
          :""
        }
      </option>
    `).join("");
  }

  const title=
    document.getElementById(
      "movementModalTitle"
    );

  if(title){
    title.textContent=
      type==="entry"
      ?tr("stockIn")
      :tr("stockOut");
  }

  openModal("movementModal");
}

async function saveMovement(e){
  if(e)e.preventDefault();

  if(!currentUser)
    return toast(
      "يجب تسجيل الدخول أولاً ❌"
    );

  const productId=
    document.getElementById(
      "movementProduct"
    )?.value||"";

  const qty=
    Number(
      document.getElementById(
        "movementQuantity"
      )?.value||0
    );

  const note=
    document.getElementById(
      "movementNote"
    )?.value.trim()||"";

  if(!productId||qty<=0)
    return toast(
      "أدخل المنتج والكمية ❌"
    );

  const product=products.find(
    p=>String(p.id)===
       String(productId)
  );

  if(!product)
    return toast(
      "المنتج غير موجود ❌"
    );

  const oldQty=
    Number(product.quantity||0);

  const newQty=
    movementType==="entry"
    ?oldQty+qty
    :oldQty-qty;

  if(newQty<0)
    return toast(
      "الكمية غير كافية في المخزون ❌"
    );

  const {data,error}=await db
    .from("products")
    .update({
      quantity:newQty
    })
    .eq("id",productId)
    .eq("user_id",currentUser.id)
    .select("*")
    .single();

  if(error){
    console.error(
      "❌ تحديث المخزون:",
      error
    );

    return toast(
      "تعذر تحديث المخزون: "+
      errText(error)
    );
  }

  const movement={
    user_id:currentUser.id,
    product_id:productId,
    type:movementType,
    quantity:qty,
    note
  };

  const result=await db
    .from("movements")
    .insert(movement)
    .select("*")
    .single();

  if(result.error){
    console.error(
      "❌ تسجيل الحركة:",
      result.error
    );

    return toast(
      "تم تحديث المخزون لكن تعذر تسجيل الحركة ⚠️"
    );
  }

  products=products.map(p=>
    String(p.id)===String(productId)
      ?data
      :p
  );

  if(result.data)
    movements=[
      result.data,
      ...movements
    ];

  renderProducts();
  renderMovements();

  closeModal("movementModal");

  const q=
    document.getElementById(
      "movementQuantity"
    );

  const n=
    document.getElementById(
      "movementNote"
    );

  if(q)q.value="";
  if(n)n.value="";

  toast(
    movementType==="entry"
    ?"تم إدخال الكمية للمخزون ✅"
    :"تم إخراج الكمية من المخزون ✅"
  );
}

function renderMovements(){
  const box=
    document.getElementById(
      "movementsList"
    );

  if(!box)return;

  if(!movements.length){
    box.innerHTML=`
      <div class="empty">
        ${tr("noData")}
      </div>
    `;
    return;
  }

  box.innerHTML=movements.map(m=>{

    const p=products.find(
      x=>String(x.id)===
         String(m.product_id)
    );

    const isEntry=
      m.type==="entry";

    return `
      <div class="data-card">

        <div class="data-main">

          <strong>
            ${safe(p?.name||"-")}
          </strong>

          <small>
            ${safe(p?.reference||"-")}
          </small>

          <small>
            ${safe(m.note||"")}
          </small>

        </div>

        <div>
          <span class="badge ${
            isEntry
            ?"success"
            :"danger"
          }">
            ${
              isEntry
              ?"+ "
              :"- "
            }${Number(m.quantity||0)}
          </span>
        </div>

        <small>
          ${
            m.created_at
            ?new Date(
              m.created_at
            ).toLocaleString("ar-DZ")
            :""
          }
        </small>

      </div>
    `;
  }).join("");
}

/* =========================
   USERS / ADMIN
========================= */

async function loadUsers(){
  if(!currentUser||!isMasterAdmin())return;

  const {data,error}=await db
    .from("profiles")
    .select("*")
    .order("created_at",{ascending:false});

  if(error){
    console.error("❌ تحميل المستخدمين:",error);
    toast("تعذر تحميل المستخدمين ❌");
    return;
  }

  users=Array.isArray(data)?data:[];

  renderUsers();
}

function renderUsers(){
  const box=document.getElementById("usersList");
  if(!box)return;

  const search=
    document.getElementById("userSearch")
      ?.value.trim().toLowerCase()||"";

  const list=users.filter(u=>{
    return !search||
      String(u.name||"")
        .toLowerCase()
        .includes(search)||
      String(u.email||"")
        .toLowerCase()
        .includes(search);
  });

  if(!list.length){
    box.innerHTML=`
      <div class="empty">
        ${tr("noData")}
      </div>
    `;
    return;
  }

  box.innerHTML=list.map(u=>{

    const master=
      String(u.email||"").toLowerCase()===
      MASTER_ADMIN_EMAIL.toLowerCase();

    const blocked=
      u.is_blocked===true||
      u.blocked===true;

    return `
      <div class="data-card">

        <div class="data-main">

          <strong>
            ${safe(u.name||u.email||"-")}
          </strong>

          <small>
            ${safe(u.email||"-")}
          </small>

          <small>
            ${safe(u.role||"worker")}
          </small>

        </div>

        <div>

          <span class="badge ${
            blocked
            ?"danger"
            :"success"
          }">
            ${
              blocked
              ?tr("blocked")
              :tr("active")
            }
          </span>

        </div>

        <div class="data-actions">

          ${
            master
            ?""
            :`
              <button
                class="btn ${
                  blocked
                  ?"btn-success"
                  :"btn-danger"
                }"
                onclick="toggleUserBlock(
                  '${safe(u.id)}',
                  ${blocked}
                )">
                ${
                  blocked
                  ?"فتح"
                  :"حظر"
                }
              </button>
            `
          }

        </div>

      </div>
    `;
  }).join("");
}

async function toggleUserBlock(id,isBlocked){
  if(!currentUser||!isMasterAdmin())
    return;

  const u=users.find(
    x=>String(x.id)===String(id)
  );

  if(!u)return;

  if(
    String(u.email||"").toLowerCase()===
    MASTER_ADMIN_EMAIL.toLowerCase()
  ){
    return toast(
      "لا يمكن حظر الحساب الرئيسي ❌"
    );
  }

  const newValue=!isBlocked;

  const {error}=await db
    .from("profiles")
    .update({
      is_blocked:newValue,
      blocked:newValue
    })
    .eq("id",id);

  if(error){
    console.error(
      "❌ تغيير حالة المستخدم:",
      error
    );

    return toast(
      "تعذر تغيير حالة المستخدم: "+
      errText(error)
    );
  }

  users=users.map(x=>
    String(x.id)===String(id)
      ?{
        ...x,
        is_blocked:newValue,
        blocked:newValue
      }
      :x
  );

  renderUsers();

  toast(
    newValue
    ?"تم حظر المستخدم ✅"
    :"تم فتح المستخدم ✅"
  );
}


/* =========================
   LOGIN
========================= */

async function login(e){
  if(e)e.preventDefault();

  const email=
    document.getElementById(
      "loginEmail"
    )?.value.trim()||"";

  const password=
    document.getElementById(
      "loginPassword"
    )?.value||"";

  if(!email||!password){
    return showLoginError(
      "أدخل البريد الإلكتروني وكلمة المرور."
    );
  }

  const btn=
    document.querySelector(
      "#loginForm button[type='submit']"
    );

  if(btn){
    btn.disabled=true;
    btn.dataset.oldText=btn.textContent;
    btn.textContent="جاري الدخول...";
  }

  const {data,error}=await db.auth.signInWithPassword({
    email,
    password
  });

  if(btn){
    btn.disabled=false;
    btn.textContent=
      btn.dataset.oldText||"دخول";
  }

  if(error){
    console.error(
      "❌ تسجيل الدخول:",
      error
    );

    return showLoginError(
      "البريد الإلكتروني أو كلمة المرور غير صحيحة."
    );
  }

  if(!data?.user){
    return showLoginError(
      "تعذر الحصول على بيانات الحساب."
    );
  }

  document.getElementById(
    "loginError"
  )?.style &&
  (document.getElementById(
    "loginError"
  ).style.display="none");

  await applyUser(data.user);

  await loadProducts();
  await loadWorkers();
  await loadEquipment();
  await loadMetrology();
  await loadMovements();

  if(isMasterAdmin())
    await loadUsers();

  go("home");
}

async function registerUser(e){
  if(e)e.preventDefault();

  const email=
    document.getElementById(
      "registerEmail"
    )?.value.trim()||"";

  const password=
    document.getElementById(
      "registerPassword"
    )?.value||"";

  const name=
    document.getElementById(
      "registerName"
    )?.value.trim()||"";

  if(!email||!password)
    return toast(
      "أدخل البريد وكلمة المرور ❌"
    );

  if(password.length<6)
    return toast(
      "كلمة المرور يجب أن تكون 6 أحرف على الأقل ❌"
    );

  const {data,error}=await db.auth.signUp({
    email,
    password
  });

  if(error){
    console.error(
      "❌ إنشاء الحساب:",
      error
    );

    return toast(
      "تعذر إنشاء الحساب: "+
      errText(error)
    );
  }

  if(data?.user){

    const {error:profileError}=await db
      .from("profiles")
      .upsert({
        id:data.user.id,
        email,
        name,
        role:"worker",
        is_blocked:false,
        blocked:false
      },{
        onConflict:"id"
      });

    if(profileError){
      console.warn(
        "تعذر إنشاء profile:",
        profileError
      );
    }
  }

  toast(
    "تم إنشاء الحساب بنجاح. يمكنك تسجيل الدخول الآن ✅"
  );

  const reg=
    document.getElementById("registerModal");

  if(reg)
    reg.classList.remove("show");
}

async function logout(){
  await db.auth.signOut();

  currentUser=null;
  isAdmin=false;

  products=[];
  workers=[];
  equipment=[];
  metrology=[];
  movements=[];
  users=[];

  showLogin();

  toast("تم تسجيل الخروج ✅");
}


/* =========================
   BACKUP / RESTORE
========================= */

async function backupData(){
  if(!currentUser)
    return toast(
      "يجب تسجيل الدخول أولاً ❌"
    );

  const backup={
    version:"2.5",
    created_at:new Date().toISOString(),
    user_id:currentUser.id,
    products,
    workers,
    equipment,
    metrology,
    movements
  };

  const blob=new Blob(
    [
      JSON.stringify(
        backup,
        null,
        2
      )
    ],
    {
      type:"application/json"
    }
  );

  const url=
    URL.createObjectURL(blob);

  const a=document.createElement("a");

  a.href=url;
  a.download=
    `Stock-Pro-Backup-${todayKey()}.json`;

  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);

  toast(
    "تم إنشاء النسخة الاحتياطية ✅"
  );
}

function restoreData(){
  const input=
    document.getElementById(
      "restoreFile"
    );

  if(input){
    input.value="";
    input.click();
  }
}

async function handleRestoreFile(e){
  const file=e.target.files?.[0];

  if(!file)return;

  if(!currentUser){
    return toast(
      "يجب تسجيل الدخول أولاً ❌"
    );
  }

  try{

    const text=
      await file.text();

    const data=
      JSON.parse(text);

    if(!data||
       typeof data!=="object"){
      throw new Error(
        "ملف النسخة الاحتياطية غير صالح"
      );
    }

    if(!confirm(
      "استرجاع النسخة قد يضيف البيانات الموجودة في الملف. هل تريد المتابعة؟"
    )){
      return;
    }

    let count=0;

    if(Array.isArray(data.products)){
      for(const row of data.products){

        const copy={
          ...row,
          user_id:currentUser.id
        };

        delete copy.id;
        delete copy.created_at;
        delete copy.updated_at;

        const {error}=await db
          .from("products")
          .insert(copy);

        if(!error)count++;
      }
    }

    if(Array.isArray(data.workers)){
      for(const row of data.workers){

        const copy={
          ...row,
          user_id:currentUser.id
        };

        delete copy.id;
        delete copy.created_at;
        delete copy.updated_at;

        const {error}=await db
          .from("workers")
          .insert(copy);

        if(!error)count++;
      }
    }

    if(Array.isArray(data.equipment)){
      for(const row of data.equipment){

        const copy={
          ...row,
          user_id:currentUser.id
        };

        delete copy.id;
        delete copy.created_at;
        delete copy.updated_at;

        const {error}=await db
          .from("equipment")
          .insert(copy);

        if(!error)count++;
      }
    }

    if(Array.isArray(data.metrology)){
      for(const row of data.metrology){

        const copy={
          ...row,
          user_id:currentUser.id
        };

        delete copy.id;
        delete copy.created_at;
        delete copy.updated_at;

        const {error}=await db
          .from("metrology")
          .insert(copy);

        if(!error)count++;
      }
    }

    if(Array.isArray(data.movements)){
      for(const row of data.movements){

        const copy={
          ...row,
          user_id:currentUser.id
        };

        delete copy.id;
        delete copy.created_at;
        delete copy.updated_at;

        const {error}=await db
          .from("movements")
          .insert(copy);

        if(!error)count++;
      }
    }

    await loadProducts();
    await loadWorkers();
    await loadEquipment();
    await loadMetrology();
    await loadMovements();

    toast(
      `تم استرجاع البيانات بنجاح ✅ (${count})`
    );

  }catch(error){

    console.error(
      "❌ استرجاع النسخة:",
      error
    );

    toast(
      "ملف النسخة غير صالح ❌"
    );
  }

  e.target.value="";
}


/* =========================
   INSTALL PWA
========================= */

window.addEventListener(
  "beforeinstallprompt",
  e=>{
    e.preventDefault();
    deferredPrompt=e;
    updateInstallButton();
  }
);

function updateInstallButton(){
  const btn=
    document.getElementById(
      "installBtn"
    );

  if(!btn)return;

  btn.style.display=
    deferredPrompt
    ?"block"
    :"none";
}

async function installApp(){
  if(!deferredPrompt){
    return toast(
      "التطبيق مثبت مسبقاً أو المتصفح لا يدعم التثبيت."
    );
  }

  deferredPrompt.prompt();

  const result=
    await deferredPrompt.userChoice;

  if(result.outcome==="accepted")
    toast("تم بدء تثبيت التطبيق ✅");

  deferredPrompt=null;

  updateInstallButton();
}

window.addEventListener(
  "appinstalled",
  ()=>{
    deferredPrompt=null;
    updateInstallButton();

    toast(
      "تم تثبيت Stock Pro بنجاح ✅"
    );
  }
);


/* =========================
   SEARCH EVENTS
========================= */

document.addEventListener(
  "input",
  e=>{

    if(e.target.id==="stockSearch")
      renderProducts();

    if(e.target.id==="workerSearch")
      renderWorkers();

    if(e.target.id==="equipmentSearch")
      renderEquipment();

    if(e.target.id==="dueSearch")
      renderDue();

    if(e.target.id==="userSearch")
      renderUsers();
  }
);


/* =========================
   GLOBAL CLICK
========================= */

document.addEventListener(
  "click",
  e=>{

    if(
      e.target.classList.contains("modal")
    ){
      e.target.classList.remove("show");
    }

  }
);


/* =========================
   SUPABASE AUTH
========================= */

async function initAuth(){

  const {
    data:{
      session
    }
  }=await db.auth.getSession();

  if(session?.user){

    const ok=
      await applyUser(session.user);

    if(ok){

      await loadProducts();
      await loadWorkers();
      await loadEquipment();
      await loadMetrology();
      await loadMovements();

      if(isMasterAdmin())
        await loadUsers();

      go("home");
    }

  }else{

    showLogin();

  }

  db.auth.onAuthStateChange(
    async(event,session)=>{

      console.log(
        "AUTH:",
        event
      );

      if(
        event==="SIGNED_IN"&&
        session?.user
      ){

        const ok=
          await applyUser(session.user);

        if(ok){

          await loadProducts();
          await loadWorkers();
          await loadEquipment();
          await loadMetrology();
          await loadMovements();

          if(isMasterAdmin())
            await loadUsers();

          go("home");
        }

      }

      if(event==="SIGNED_OUT"){

        currentUser=null;
        isAdmin=false;

        products=[];
        workers=[];
        equipment=[];
        metrology=[];
        movements=[];
        users=[];

        showLogin();
      }

    }
  );
}


/* =========================
   DOM READY
========================= */

document.addEventListener(
  "DOMContentLoaded",
  ()=>{

    console.log(
      "🚀 Stock Pro v2.5"
    );

    translateApp();

    const loginForm=
      document.getElementById(
        "loginForm"
      );

    if(loginForm){
      loginForm.addEventListener(
        "submit",
        login
      );
    }

    const registerForm=
      document.getElementById(
        "registerForm"
      );

    if(registerForm){
      registerForm.addEventListener(
        "submit",
        registerUser
      );
    }

    const workerForm=
      document.getElementById(
        "workerForm"
      );

    if(workerForm){
      workerForm.addEventListener(
        "submit",
        saveWorker
      );
    }

    const productForm=
      document.getElementById(
        "productForm"
      );

    if(productForm){
      productForm.addEventListener(
        "submit",
        saveProduct
      );
    }

    const equipmentForm=
      document.getElementById(
        "equipmentForm"
      );

    if(equipmentForm){
      equipmentForm.addEventListener(
        "submit",
        saveEquipment
      );
    }

    const metrologyForm=
      document.getElementById(
        "metrologyForm"
      );

    if(metrologyForm){
      metrologyForm.addEventListener(
        "submit",
        saveMetrology
      );
    }

    const movementForm=
      document.getElementById(
        "movementForm"
      );

    if(movementForm){
      movementForm.addEventListener(
        "submit",
        saveMovement
      );
    }

    const restore=
      document.getElementById(
        "restoreFile"
      );

    if(restore){
      restore.addEventListener(
        "change",
        handleRestoreFile
      );
    }

    document.querySelectorAll(
      "[data-page]"
    ).forEach(btn=>{
      btn.addEventListener(
        "click",
        ()=>{
          go(btn.dataset.page);
        }
      );
    });

    const lang=
      document.getElementById(
        "languageSelect"
      );

    if(lang){
      lang.addEventListener(
        "change",
        e=>{
          changeLanguage(
            e.target.value
          );
        }
      );
    }

    initAuth();

  }
);


/* =========================
   GLOBAL FUNCTIONS
========================= */

window.go=go;
window.openModal=openModal;
window.closeModal=closeModal;
window.closeAllModals=closeAllModals;

window.login=login;
window.logout=logout;
window.registerUser=registerUser;

window.togglePassword=
  togglePassword;

window.changeLanguage=
  changeLanguage;

window.saveProduct=
  saveProduct;

window.deleteProduct=
  deleteProduct;

window.saveWorker=
  saveWorker;

window.updateWorker=
  updateWorker;

window.editWorker=
  editWorker;

window.deleteWorker=
  deleteWorker;

window.saveEquipment=
  saveEquipment;

window.deleteEquipment=
  deleteEquipment;

window.saveMetrology=
  saveMetrology;

window.deleteMetrology=
  deleteMetrology;

window.openMovement=
  openMovement;

window.saveMovement=
  saveMovement;

window.loadProducts=
  loadProducts;

window.loadWorkers=
  loadWorkers;

window.loadEquipment=
  loadEquipment;

window.loadMetrology=
  loadMetrology;

window.loadMovements=
  loadMovements;

window.loadUsers=
  loadUsers;

window.toggleUserBlock=
  toggleUserBlock;

window.backupData=
  backupData;

window.restoreData=
  restoreData;

window.installApp=
  installApp;

window.updateInstallButton=
  updateInstallButton;

console.log(
  "✅ Stock Pro v2.5 app.js chargé"
);
