// Stock Pro v2.5 - Workers Fixed
const SUPABASE_URL="https://mpanymikmqajpppipmxy.supabase.co";
const SUPABASE_ANON_KEY="sb_publishable_gFcCXJ4jzWl4P8CDBi-uhQ_Gkr1EHa4";
const db=supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);

const ADMIN_EMAIL="azizsolo.190@gmail.com";
const MASTER_ADMIN_EMAIL=ADMIN_EMAIL;

let currentUser=null,
    isAdmin=false,
    products=[],
    workers=[],
    equipment=[],
    metrology=[],
    movements=[],
    users=[],
    movementType="entry",
    deferredPrompt=null;

function todayKey(){
  return new Date().toISOString().slice(0,10);
}

function formatDate(d){
  if(!d)return "-";
  return new Date(d+"T00:00:00").toLocaleDateString("ar-DZ");
}

function addMonths(s,n){
  const d=new Date(s+"T00:00:00");
  d.setMonth(d.getMonth()+n);
  return d.toISOString().slice(0,10);
}

function addDays(s,n){
  const d=new Date(s+"T00:00:00");
  d.setDate(d.getDate()+n);
  return d.toISOString().slice(0,10);
}

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

  window.__toast=setTimeout(()=>{
    e.classList.remove("show");
  },3000);
}

function showLogin(){
  const login=document.getElementById("loginScreen");
  const app=document.getElementById("app");

  if(login)login.style.display="flex";
  if(app)app.style.display="none";
}

function isMasterAdmin(){
  return String(currentUser?.email||"").toLowerCase()===
    MASTER_ADMIN_EMAIL.toLowerCase();
}

function showApp(){

  const login=document.getElementById("loginScreen");
  const app=document.getElementById("app");

  if(login)login.style.display="none";
  if(app)app.style.display="block";

  const se=document.getElementById("settingsEmail");
  if(se)se.textContent=currentUser?.email||"";

  const ls=document.getElementById("languageSelect");
  if(ls)ls.value=currentLanguage;

  if(typeof updateInstallButton==="function"){
    updateInstallButton();
  }

  changeLanguage(currentLanguage);

  const adminNav=document.getElementById("adminNav");

  if(adminNav){
    adminNav.classList.toggle("show",isMasterAdmin());
  }
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

  if(i){
    i.textContent=e.type==="password"?"👁️":"🙈";
  }
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
    user.email?.toLowerCase()===ADMIN_EMAIL.toLowerCase() ||
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

  if(isAdmin){
    setTimeout(loadUsers,100);
  }

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
  remaining:"Remaining",
  month:"month",
  months:"months",
  day:"day",
  days:"days",
  today:"Due today",
  overdue:"Overdue",
  developer:"Developer",
  account:"👤 Account",
  logout:"🚪 Log out",
  language:"Application language",
  currentAccount:"Current account",
  developerTitle:"👨‍💻 Developer",
  active:"Active",
  inactive:"Inactive",
  admin:"ADMIN",
  worker:"WORKER",
  blocked:"Blocked",
  noData:"No data.",
  noProducts:"No products.",
  noWorkers:"No workers.",
  noEquipment:"No equipment.",
  noDue:"No due items currently."
 }

};

function tr(k){
  return (I18N[currentLanguage]||I18N.ar)[k]||
         I18N.ar[k]||
         k;
}

function equipmentLabel(t){

  return ({
    shoes:{
      ar:"حذاء حماية",
      fr:"Chaussures de sécurité",
      en:"Safety shoes"
    },
    bleu:{
      ar:"ملابس العمل",
      fr:"Bleu de travail",
      en:"Work clothes"
    },
    glasses:{
      ar:"نظارات حماية",
      fr:"Lunettes de sécurité",
      en:"Safety glasses"
    },
    gants:{
      ar:"قفازات",
      fr:"Gants",
      en:"Gloves"
    },
    vest_soudeur:{
      ar:"سترة لحام",
      fr:"Vest soudeur",
      en:"Welding vest"
    }
  }[t]||{})[currentLanguage]||t;
}

function statusText(s){
  return s==="due"
    ?tr("due")
    :s==="soon"
      ?tr("soon")
      :s==="notdue"
        ?tr("notDue")
        :tr("notIssued");
}

function remainingText(date){

  if(!date)return tr("notIssued");

  const diff=dueDiffDays(date);

  if(diff<=0){
    return diff===0
      ?tr("today")
      :`${tr("overdue")} ${Math.abs(diff)} ${Math.abs(diff)===1?tr("day"):tr("days")}`;
  }

  const a=new Date(todayKey()+"T00:00:00");
  const b=new Date(date+"T00:00:00");

  let months=
    (b.getFullYear()-a.getFullYear())*12+
    (b.getMonth()-a.getMonth());

  let anchor=new Date(a);

  anchor.setMonth(anchor.getMonth()+months);

  if(anchor>b){
    months--;
    anchor=new Date(a);
    anchor.setMonth(anchor.getMonth()+months);
  }

  const days=Math.floor((b-anchor)/86400000);

  let parts=[];

  if(months===1){
    parts.push(`1 ${tr("month")}`);
  }
  else if(months>1){
    parts.push(`${months} ${tr("months")}`);
  }

  if(days>0){
    parts.push(
      `${days} ${days===1?tr("day"):tr("days")}`
    );
  }

  return `${tr("remaining")} ${parts.join(currentLanguage==="ar"?" و ":" ")}`;
}

function translateApp(){

  const map={
    products:"products",
    workers:"workers",
    equipment:"equipment",
    due:"duePage",
    reports:"reports",
    settings:"settings",
    admin:"users",
    quick:"quick",
    addProduct:"addProduct",
    newMaterial:"newMaterial",
    stockIn:"stockIn",
    stockOut:"stockOut",
    issueEquipment:"issueEquipment",
    latestProducts:"latestProducts",
    showAll:"showAll",
    quantity:"quantity",
    category:"category",
    reference:"reference",
    account:"account",
    logout:"logout",
    language:"language",
    developerTitle:"developerTitle"
  };

  document.querySelectorAll("[data-i18n]").forEach(e=>{
    const k=e.dataset.i18n;
    e.textContent=tr(k);
  });

  document.querySelectorAll("input[placeholder]").forEach(e=>{

    if(e.id==="stockSearch")
      e.placeholder=tr("searchProduct");

    if(e.id==="workerSearch")
      e.placeholder=tr("searchWorker");

    if(e.id==="equipmentSearch")
      e.placeholder=tr("searchEquipment");

    if(e.id==="dueSearch")
      e.placeholder=tr("searchDue");

    if(e.id==="userSearch")
      e.placeholder=tr("searchUser");
  });

  const title=document.querySelector(".subtitle");

  if(title){
    title.textContent=
      currentLanguage==="ar"
        ?"Gestion de Stock"
        :currentLanguage==="fr"
          ?"Gestion de Stock"
          :"Stock Management";
  }

  document.documentElement.lang=currentLanguage;

  document.documentElement.dir=
    currentLanguage==="ar"?"rtl":"ltr";
}

function changeLanguage(lang){

  if(!I18N[lang])lang="ar";

  currentLanguage=lang;

  localStorage.setItem(
    "stockpro_language",
    lang
  );

  translateApp();

  const select=document.getElementById("languageSelect");

  if(select){
    select.value=lang;
  }

  renderProducts();
  renderWorkers();
  renderEquipment();
  renderDue();
  renderMetrology();
  renderHomeProducts();
  renderMovementReport();
}

function checkSession(){

  db.auth.getSession().then(async({data})=>{

    if(data?.session?.user){

      const ok=await applyUser(data.session.user);

      if(ok){
        await loadAll();
      }

    }else{

      showLogin();

    }

  });
}

async function login(e){

  if(e)e.preventDefault();

  const email=
    document.getElementById("loginEmail")?.value.trim();

  const password=
    document.getElementById("loginPassword")?.value||"";

  if(!email||!password){
    showLoginError("أدخل البريد الإلكتروني وكلمة السر.");
    return;
  }

  const btn=document.getElementById("loginBtn");

  if(btn){
    btn.disabled=true;
    btn.textContent="جاري الدخول...";
  }

  const {data,error}=await db.auth.signInWithPassword({
    email,
    password
  });

  if(error){

    console.error("Login:",error);

    showLoginError(
      error.message||"تعذر تسجيل الدخول."
    );

    if(btn){
      btn.disabled=false;
      btn.textContent="دخول إلى التطبيق";
    }

    return;
  }

  const ok=await applyUser(data.user);

  if(ok){
    await loadAll();
  }

  if(btn){
    btn.disabled=false;
    btn.textContent="دخول إلى التطبيق";
  }
}

async function logout(){

  await db.auth.signOut();

  currentUser=null;
  isAdmin=false;

  showLogin();

  const pass=document.getElementById("loginPassword");

  if(pass){
    pass.value="";
  }
}

db.auth.onAuthStateChange((event,session)=>{

  if(event==="SIGNED_OUT"){

    currentUser=null;
    isAdmin=false;

    showLogin();

  }
  else if(event==="SIGNED_IN"&&session){

    setTimeout(async()=>{

      if(await applyUser(session.user)){
        await loadAll();
      }

    },0);
  }

});

function showPage(id,btn){

  if(id==="reports"){
    setTimeout(refreshMovementReport,0);
  }

  if(id==="admin"&&!isAdmin){
    toast("هذه الصفحة للأدمن فقط ❌");
    return;
  }

  document
    .querySelectorAll(".page")
    .forEach(x=>x.classList.remove("active"));

  const p=document.getElementById(id);

  if(p)p.classList.add("active");

  document
    .querySelectorAll(".nav button")
    .forEach(x=>x.classList.remove("active"));

  if(btn)btn.classList.add("active");
}

function activatePage(id){

  const b=[
    ...document.querySelectorAll(".nav button")
  ].find(x=>
    x.getAttribute("onclick")?.includes("'"+id+"'")
  );

  showPage(id,b);
}

function closeModal(id){

  const modal=document.getElementById(id);

  if(modal){
    modal.classList.remove("show");
  }
}

async function loadAll(){

  await Promise.all([
    loadProducts(),
    loadWorkers(),
    loadEquipment(),
    loadMetrology(),
    loadMovements()
  ]);

  statistics();
  renderDue();
  renderEquipment();
  renderMetrology();
  renderHomeProducts();
}

async function loadProducts(){

  if(!currentUser)return;

  const {data,error}=await db
    .from("products")
    .select("*")
    .eq("user_id",currentUser.id)
    .order("name");

  if(error){
    toast("خطأ في تحميل المنتجات ❌");
    console.error(error);
    return;
  }

  products=data||[];

  renderProducts();
}

let stockFilter="all";

function setStockFilter(filter){

  stockFilter=filter||"all";

  renderProducts();
}

function activateStockFilter(filter){

  showPage(
    "stock",
    [...document.querySelectorAll(".nav button")]
      .find(x=>
        x.getAttribute("onclick")?.includes("'stock'")
      )
  );

  setStockFilter(filter);

  document
    .getElementById("stock")
    ?.scrollIntoView({
      behavior:"smooth",
      block:"start"
    });
}

function renderProducts(){

  const box=document.getElementById("products");

  if(!box)return;

  const q=
    (document.getElementById("stockSearch")?.value||"")
      .toLowerCase()
      .trim();

  box.innerHTML="";

  const list=products.filter(p=>{

    const qty=Number(p.quantity||0);

    const min=
      Number(
        p.min_quantity??
        p.min_qty??
        0
      );

    const status=
      qty===0
        ?"empty"
        :(min>0&&qty<=min
          ?"low"
          :"available");

    const matchesStatus=
      stockFilter==="all"||
      stockFilter===status;

    const textMatch=
      (p.name||"").toLowerCase().includes(q)||
      (p.reference||"").toLowerCase().includes(q);

    return matchesStatus&&textMatch;
  });

  list.forEach(p=>{

    const div=document.createElement("div");

    div.className="product";

    const qty=Number(p.quantity||0);

    const min=
      Number(
        p.min_quantity??
        p.min_qty??
        0
      );

    const low=
      min>0&&
      qty<=min&&
      qty>0;

    div.innerHTML=`
      <div class="product-main">

        <div class="product-info">

          <div class="product-icon">📦</div>

          <div>
            <div class="product-name">
              ${safe(p.name)}
            </div>

            <div class="product-ref">
              ${safe(p.reference)} ·
              ${safe(p.family||"غير مصنف")}
            </div>
          </div>

        </div>

        <div class="quantity ${low?"low":"good"}">
          ${qty}
          <small>الكمية</small>
        </div>

      </div>

      <div class="product-actions">

        <button
          class="small-btn edit"
          onclick="openProduct('${safe(p.id)}')">
          ✏️ تعديل
        </button>

        <button
          class="small-btn delete"
          onclick="deleteProduct('${safe(p.id)}')">
          🗑️ حذف
        </button>

      </div>
    `;

    box.appendChild(div);
  });

  if(!box.children.length){

    const labels={
      all:"لا توجد منتجات.",
      available:"لا توجد مواد متوفرة فوق الحد الأدنى.",
      low:"لا توجد مواد بلغت الحد الأدنى.",
      empty:"لا توجد مواد نفد مخزونها."
    };

    box.innerHTML=`
      <div class="info-box" style="text-align:center">
        ${labels[stockFilter]||labels.all}
      </div>
    `;
  }
}

function renderHomeProducts(){

  const box=document.getElementById("homeProducts");

  if(!box)return;

  box.innerHTML="";

  products.slice(0,5).forEach(p=>{

    const d=document.createElement("div");

    d.className="product";

    d.innerHTML=`
      <div class="product-main">

        <div class="product-info">

          <div class="product-icon">📦</div>

          <div>
            <div class="product-name">
              ${safe(p.name)}
            </div>

            <div class="product-ref">
              ${safe(p.reference)}
            </div>
          </div>

        </div>

        <div class="quantity">
          ${Number(p.quantity||0)}
          <small>الكمية</small>
        </div>

      </div>
    `;

    box.appendChild(d);
  });

  if(!box.children.length){

    box.innerHTML=
      '<div class="info-box" style="text-align:center">لا توجد منتجات بعد.</div>';
  }
}

function openProduct(id=null){

  document.getElementById("productId").value=id||"";

  if(id){

    const p=products.find(x=>x.id===id);

    if(!p)return;

    document.getElementById("productCode").value=
      p.reference||"";

    document.getElementById("productName").value=
      p.name||"";

    document.getElementById("productCategory").value=
      p.family||"";

    document.getElementById("productQty").value=
      p.quantity||0;

    document.getElementById("productMinQty").value=
      p.min_quantity??
      p.min_qty??
      0;

  }else{

    document.getElementById("productCode").value="";
    document.getElementById("productName").value="";
    document.getElementById("productCategory").value="";
    document.getElementById("productQty").value=0;
    document.getElementById("productMinQty").value=0;
  }

  document
    .getElementById("productModal")
    .classList.add("show");
}

async function saveProduct(e){

  e.preventDefault();

  if(!currentUser){
    return toast("يجب تسجيل الدخول أولاً ❌");
  }

  const id=
    document.getElementById("productId").value;

  const obj={
    user_id:currentUser.id,
    name:
      document.getElementById("productName")
        .value.trim(),
    reference:
      document.getElementById("productCode")
        .value.trim(),
    family:
      document.getElementById("productCategory")
        .value.trim(),
    quantity:
      Number(
        document.getElementById("productQty").value
      )||0,
    min_quantity:
      Math.max(
        0,
        Number(
          document.getElementById("productMinQty").value
        )||0
      )
  };

  if(!obj.name||!obj.reference){
    return toast("أدخل اسم السلعة والمرجع ❌");
  }

  const r=id
    ?await db
      .from("products")
      .update(obj)
      .eq("id",id)
      .eq("user_id",currentUser.id)
    :await db
      .from("products")
      .insert(obj);

  if(r.error){

    console.error(r.error);

    return toast(
      "تعذر إضافة السلعة: "+
      errText(r.error)
    );
  }

  closeModal("productModal");

  await loadProducts();

  statistics();

  toast(
    id
      ?"تم تعديل السلعة ✅"
      :"تمت إضافة السلعة ✅"
  );
}

async function deleteProduct(id){

  if(!confirm("هل أنت متأكد من حذف المنتج؟"))return;

  const {error}=await db
    .from("products")
    .delete()
    .eq("id",id)
    .eq("user_id",currentUser.id);

  if(error){
    toast("تعذر حذف المنتج: "+errText(error));
    return;
  }

  await loadProducts();

  statistics();

  toast("تم حذف المنتج ✅");
}
/* =========================
   WORKERS v2.5 FIX
========================= */

async function loadWorkers(){

  try{

    if(!currentUser){

      workers=[];

      renderWorkers();

      return;
    }

    const {data,error}=await db
      .from("workers")
      .select("*")
      .eq("user_id",currentUser.id)
      .order("name",{ascending:true});

    if(error){

      console.error(
        "loadWorkers error:",
        error
      );

      toast(
        "خطأ في تحميل العمال ❌"
      );

      workers=[];

      renderWorkers();

      return;
    }

    workers=
      Array.isArray(data)
        ?data
        :[];

    console.log(
      "Workers loaded:",
      workers
    );

    renderWorkers();

  }catch(error){

    console.error(
      "loadWorkers exception:",
      error
    );

    workers=[];

    renderWorkers();
  }
}

function renderWorkers(){

  const box=
    document.getElementById(
      "workersList"
    );

  if(!box){

    console.warn(
      "workersList غير موجود في الصفحة"
    );

    return;
  }

  const searchInput=
    document.getElementById(
      "workerSearch"
    );

  const q=
    (
      searchInput?.value||
      ""
    )
      .toLowerCase()
      .trim();

  box.innerHTML="";

  const filtered=
    workers.filter(w=>{

      const name=
        String(
          w.name||""
        ).toLowerCase();

      const matricule=
        String(
          w.matricule||""
        ).toLowerCase();

      const job=
        String(
          w.job||""
        ).toLowerCase();

      return(
        !q||
        name.includes(q)||
        matricule.includes(q)||
        job.includes(q)
      );
    });

  if(!filtered.length){

    box.innerHTML=`
      <div
        class="info-box"
        style="text-align:center"
      >
        👷 لا يوجد عمال
        ${q?" مطابقون للبحث":""}.
      </div>
    `;

    return;
  }

  filtered.forEach(w=>{

    const d=
      document.createElement(
        "div"
      );

    d.className="worker";

    const workerId=
      String(w.id||"");

    d.innerHTML=`

      <div class="worker-main">

        <div class="worker-info">

          <div class="worker-icon">
            👷
          </div>

          <div>

            <div class="worker-name">
              ${safe(w.name||"")}
            </div>

            <div class="worker-matricule">
              Matricule:
              ${safe(w.matricule||"")}
            </div>

            <div
              style="
                font-size:11px;
                color:#6b7280;
                margin-top:4px
              "
            >
              ${safe(w.job||"")}
            </div>

          </div>

        </div>

        <span
          class="worker-status
          ${w.status==="inactive"?"inactive":""}"
        >
          ${
            w.status==="inactive"
              ?"غير نشط"
              :"نشط"
          }
        </span>

      </div>

      <div class="product-actions">

        <button
          class="small-btn delete"
          type="button"
          onclick="deleteWorker('${workerId}')"
        >
          🗑️ حذف
        </button>

      </div>
    `;

    box.appendChild(d);

  });
}

function openWorker(){

  const matricule=
    document.getElementById(
      "workerMatricule"
    );

  const name=
    document.getElementById(
      "workerName"
    );

  const role=
    document.getElementById(
      "workerRole"
    );

  const modal=
    document.getElementById(
      "workerModal"
    );

  if(matricule)
    matricule.value="";

  if(name)
    name.value="";

  if(role)
    role.value="";

  if(modal)
    modal.classList.add("show");
}

async function saveWorker(e){

  if(e)
    e.preventDefault();

  if(!currentUser){

    toast(
      "يجب تسجيل الدخول أولاً ❌"
    );

    return;
  }

  try{

    const matriculeEl=
      document.getElementById(
        "workerMatricule"
      );

    const nameEl=
      document.getElementById(
        "workerName"
      );

    const roleEl=
      document.getElementById(
        "workerRole"
      );

    if(
      !matriculeEl||
      !nameEl||
      !roleEl
    ){

      console.error(
        "حقول العامل غير موجودة"
      );

      toast(
        "خطأ في نموذج العامل ❌"
      );

      return;
    }

    const matricule=
      matriculeEl.value.trim();

    const name=
      nameEl.value.trim();

    const job=
      roleEl.value.trim();

    if(
      !matricule||
      !name
    ){

      toast(
        "أدخل Matricule واسم العامل ❌"
      );

      return;
    }

    const duplicate=
      workers.some(w=>
        String(
          w.matricule||""
        )
          .trim()
          .toLowerCase()===
        matricule.toLowerCase()
      );

    if(duplicate){

      toast(
        "هذا الـ Matricule موجود بالفعل ❌"
      );

      return;
    }

    const obj={

      user_id:
        currentUser.id,

      matricule:
        matricule,

      name:
        name,

      job:
        job,

      status:
        "active"
    };

    console.log(
      "Adding worker:",
      obj
    );

    const {data,error}=
      await db
        .from("workers")
        .insert([obj])
        .select()
        .single();

    if(error){

      console.error(
        "Insert worker error:",
        error
      );

      toast(
        "تعذر إضافة العامل: "+
        errText(error)
      );

      return;
    }

    console.log(
      "Worker inserted successfully:",
      data
    );

    closeModal(
      "workerModal"
    );

    await loadWorkers();

    try{

      await loadEquipment();

    }catch(err){

      console.warn(
        "loadEquipment after worker:",
        err
      );
    }

    try{

      renderDue();

    }catch(err){

      console.warn(
        "renderDue after worker:",
        err
      );
    }

    try{

      statistics();

    }catch(err){

      console.warn(
        "statistics after worker:",
        err
      );
    }

    toast(
      "تمت إضافة العامل بنجاح ✅"
    );

  }catch(error){

    console.error(
      "saveWorker exception:",
      error
    );

    toast(
      "حدث خطأ أثناء إضافة العامل ❌"
    );
  }
}

document.addEventListener(
  "input",
  function(e){

    if(
      e.target&&
      e.target.id==="workerSearch"
    ){

      renderWorkers();
    }

  }
);

async function refreshWorkers(){

  try{

    await loadWorkers();

    try{

      await loadEquipment();

    }catch(e){

      console.warn(e);
    }

    try{

      renderDue();

    }catch(e){

      console.warn(e);
    }

    toast(
      "تم تحديث قائمة العمال ✅"
    );

  }catch(e){

    console.error(
      "refreshWorkers:",
      e
    );
  }
}

async function deleteWorker(id){

  if(!currentUser){

    toast(
      "يجب تسجيل الدخول أولاً ❌"
    );

    return;
  }

  if(!id){

    toast(
      "معرّف العامل غير موجود ❌"
    );

    return;
  }

  const worker=
    workers.find(
      w=>String(w.id)===String(id)
    );

  const workerName=
    worker?.name||
    "هذا العامل";

  if(
    !confirm(
      `هل أنت متأكد من حذف العامل "${workerName}"؟`
    )
  ){

    return;
  }

  try{

    const {error}=
      await db
        .from("workers")
        .delete()
        .eq("id",id)
        .eq(
          "user_id",
          currentUser.id
        );

    if(error){

      console.error(
        "deleteWorker:",
        error
      );

      toast(
        "تعذر حذف العامل: "+
        errText(error)
      );

      return;
    }

    await loadWorkers();

    try{

      await loadEquipment();

    }catch(e){

      console.warn(e);
    }

    try{

      renderDue();

    }catch(e){

      console.warn(e);
    }

    statistics();

    toast(
      "تم حذف العامل ✅"
    );

  }catch(error){

    console.error(
      "deleteWorker exception:",
      error
    );

    toast(
      "حدث خطأ أثناء حذف العامل ❌"
    );
  }
}


/* =========================
   EQUIPMENT
========================= */

const EQUIPMENT_RULES={

  shoes:{
    days:null,
    months:12
  },

  bleu:{
    days:null,
    months:6
  },

  glasses:{
    days:null,
    months:6
  },

  gants:{
    days:35,
    months:null
  },

  vest_soudeur:{
    days:null,
    months:6
  }

};

function equipmentCycle(type){

  const r=
    EQUIPMENT_RULES[type];

  if(!r)
    return 0;

  if(r.days)
    return r.days;

  return r.months||0;
}

function equipmentDueDate(
  issueDate,
  type
){

  if(!issueDate)
    return null;

  const r=
    EQUIPMENT_RULES[type];

  if(!r)
    return null;

  if(r.days)
    return addDays(
      issueDate,
      r.days
    );

  if(r.months)
    return addMonths(
      issueDate,
      r.months
    );

  return null;
}

function equipmentStatus(
  dueDate
){

  if(!dueDate)
    return "notdue";

  const diff=
    dueDiffDays(dueDate);

  if(diff<=0)
    return "due";

  if(diff<=30)
    return "soon";

  return "notdue";
}

async function loadEquipment(){

  if(!currentUser){

    equipment=[];

    renderEquipment();

    return;
  }

  try{

    const {data,error}=
      await db
        .from("equipment")
        .select("*")
        .eq(
          "user_id",
          currentUser.id
        )
        .order(
          "created_at",
          {
            ascending:false
          }
        );

    if(error){

      console.error(
        "loadEquipment:",
        error
      );

      equipment=[];

      renderEquipment();

      return;
    }

    equipment=
      Array.isArray(data)
        ?data
        :[];

    renderEquipment();

  }catch(error){

    console.error(
      "loadEquipment exception:",
      error
    );

    equipment=[];

    renderEquipment();
  }
}

function renderEquipment(){

  const box=
    document.getElementById(
      "equipmentList"
    );

  if(!box)
    return;

  const q=
    (
      document.getElementById(
        "equipmentSearch"
      )?.value||""
    )
      .toLowerCase()
      .trim();

  box.innerHTML="";

  const list=
    equipment.filter(e=>{

      const worker=
        workers.find(
          w=>String(w.id)===
             String(e.worker_id)
        );

      const workerName=
        worker?.name||
        e.worker_name||
        "";

      const matricule=
        worker?.matricule||
        e.matricule||
        "";

      const type=
        equipmentLabel(
          e.equipment_type||
          e.type||
          ""
        );

      return(
        !q||
        workerName
          .toLowerCase()
          .includes(q)||
        matricule
          .toLowerCase()
          .includes(q)||
        type
          .toLowerCase()
          .includes(q)
      );
    });

  if(!list.length){

    box.innerHTML=`
      <div
        class="info-box"
        style="text-align:center"
      >
        لا توجد بيانات تجهيزات.
      </div>
    `;

    return;
  }

  list.forEach(e=>{

    const worker=
      workers.find(
        w=>String(w.id)===
           String(e.worker_id)
      );

    const workerName=
      worker?.name||
      e.worker_name||
      "-";

    const matricule=
      worker?.matricule||
      e.matricule||
      "-";

    const type=
      e.equipment_type||
      e.type||
      "";

    const label=
      equipmentLabel(type);

    const issueDate=
      e.issue_date||
      e.date||
      e.created_at?.slice(0,10);

    const dueDate=
      e.due_date||
      equipmentDueDate(
        issueDate,
        type
      );

    const status=
      equipmentStatus(
        dueDate
      );

    const d=
      document.createElement("div");

    d.className="product";

    d.innerHTML=`

      <div class="product-main">

        <div class="product-info">

          <div class="product-icon">
            🦺
          </div>

          <div>

            <div class="product-name">
              ${safe(label)}
            </div>

            <div class="product-ref">
              ${safe(workerName)}
              ·
              ${safe(matricule)}
            </div>

            <div
              style="
                font-size:11px;
                color:#6b7280;
                margin-top:4px
              "
            >
              تاريخ التسليم:
              ${safe(formatDate(issueDate))}
            </div>

          </div>

        </div>

        <div
          class="quantity
          ${status==="due"
            ?"low"
            :status==="soon"
              ?"warning"
              :"good"}"
        >
          ${dueDate?formatDate(dueDate):"-"}

          <small>
            ${statusText(status)}
          </small>
        </div>

      </div>

      <div class="product-actions">

        <button
          class="small-btn delete"
          type="button"
          onclick="deleteEquipment('${safe(e.id)}')"
        >
          🗑️ حذف
        </button>

      </div>
    `;

    box.appendChild(d);

  });
}

function openEquipment(){

  const modal=
    document.getElementById(
      "equipmentModal"
    );

  if(!modal)
    return;

  const worker=
    document.getElementById(
      "equipmentWorker"
    );

  const type=
    document.getElementById(
      "equipmentType"
    );

  const date=
    document.getElementById(
      "equipmentDate"
    );

  if(worker)
    worker.value="";

  if(type)
    type.value="shoes";

  if(date)
    date.value=todayKey();

  modal.classList.add("show");

  fillWorkerSelect(
    "equipmentWorker"
  );
}

function fillWorkerSelect(id){

  const select=
    document.getElementById(id);

  if(!select)
    return;

  select.innerHTML=
    '<option value="">اختر العامل</option>';

  workers.forEach(w=>{

    const option=
      document.createElement(
        "option"
      );

    option.value=w.id;

    option.textContent=
      `${w.matricule||""} - ${w.name||""}`;

    select.appendChild(option);
  });
}

async function saveEquipment(e){

  e.preventDefault();

  if(!currentUser){

    toast(
      "يجب تسجيل الدخول أولاً ❌"
    );

    return;
  }

  const workerId=
    document.getElementById(
      "equipmentWorker"
    )?.value;

  const type=
    document.getElementById(
      "equipmentType"
    )?.value;

  const issueDate=
    document.getElementById(
      "equipmentDate"
    )?.value||
    todayKey();

  if(!workerId||!type){

    toast(
      "اختر العامل والتجهيز ❌"
    );

    return;
  }

  const worker=
    workers.find(
      w=>String(w.id)===
         String(workerId)
    );

  if(!worker){

    toast(
      "العامل غير موجود ❌"
    );

    return;
  }

  const dueDate=
    equipmentDueDate(
      issueDate,
      type
    );

  const obj={

    user_id:
      currentUser.id,

    worker_id:
      worker.id,

    equipment_type:
      type,

    issue_date:
      issueDate,

    due_date:
      dueDate,

    worker_name:
      worker.name,

    matricule:
      worker.matricule

  };

  try{

    const {error}=
      await db
        .from("equipment")
        .insert([obj]);

    if(error){

      console.error(
        "saveEquipment:",
        error
      );

      toast(
        "تعذر تسجيل التجهيز: "+
        errText(error)
      );

      return;
    }

    closeModal(
      "equipmentModal"
    );

    await loadEquipment();

    renderDue();

    statistics();

    toast(
      "تم تسجيل تسليم التجهيز ✅"
    );

  }catch(error){

    console.error(
      "saveEquipment exception:",
      error
    );

    toast(
      "حدث خطأ أثناء حفظ التجهيز ❌"
    );
  }
}

async function deleteEquipment(id){

  if(!currentUser)
    return;

  if(
    !confirm(
      "هل تريد حذف عملية التسليم؟"
    )
  )
    return;

  const {error}=
    await db
      .from("equipment")
      .delete()
      .eq("id",id)
      .eq(
        "user_id",
        currentUser.id
      );

  if(error){

    toast(
      "تعذر حذف العملية: "+
      errText(error)
    );

    return;
  }

  await loadEquipment();

  renderDue();

  statistics();

  toast(
    "تم حذف العملية ✅"
  );
}


/* =========================
   DUE ITEMS
========================= */

function dueDiffDays(date){

  if(!date)
    return 99999;

  const a=
    new Date(
      todayKey()+
      "T00:00:00"
    );

  const b=
    new Date(
      date+
      "T00:00:00"
    );

  return Math.ceil(
    (b-a)/86400000
  );
}

function renderDue(){

  const box=
    document.getElementById(
      "dueList"
    );

  if(!box)
    return;

  const q=
    (
      document.getElementById(
        "dueSearch"
      )?.value||""
    )
      .toLowerCase()
      .trim();

  box.innerHTML="";

  const list=
    equipment
      .map(e=>{

        const worker=
          workers.find(
            w=>String(w.id)===
               String(e.worker_id)
          );

        const workerName=
          worker?.name||
          e.worker_name||
          "";

        const matricule=
          worker?.matricule||
          e.matricule||
          "";

        const type=
          e.equipment_type||
          e.type||
          "";

        const dueDate=
          e.due_date||
          equipmentDueDate(
            e.issue_date||
            e.date,
            type
          );

        const status=
          equipmentStatus(
            dueDate
          );

        return{
          ...e,
          workerName,
          matricule,
          type,
          dueDate,
          status
        };
      })
      .filter(e=>{

        const textMatch=
          !q||
          e.workerName
            .toLowerCase()
            .includes(q)||
          e.matricule
            .toLowerCase()
            .includes(q)||
          equipmentLabel(e.type)
            .toLowerCase()
            .includes(q);

        return textMatch;
      })
      .sort(
        (a,b)=>
          dueDiffDays(a.dueDate)-
          dueDiffDays(b.dueDate)
      );

  if(!list.length){

    box.innerHTML=`
      <div
        class="info-box"
        style="text-align:center"
      >
        لا توجد استحقاقات حالياً.
      </div>
    `;

    return;
  }

  list.forEach(e=>{

    const d=
      document.createElement("div");

    d.className="product";

    d.innerHTML=`

      <div class="product-main">

        <div class="product-info">

          <div class="product-icon">
            ⏰
          </div>

          <div>

            <div class="product-name">
              ${safe(e.workerName)}
            </div>

            <div class="product-ref">
              ${safe(e.matricule)}
              ·
              ${safe(
                equipmentLabel(e.type)
              )}
            </div>

            <div
              style="
                font-size:11px;
                color:#6b7280;
                margin-top:4px
              "
            >
              الاستحقاق:
              ${safe(
                formatDate(e.dueDate)
              )}
            </div>

          </div>

        </div>

        <div
          class="quantity
          ${e.status==="due"
            ?"low"
            :e.status==="soon"
              ?"warning"
              :"good"}"
        >

          ${remainingText(e.dueDate)}

          <small>
            ${statusText(e.status)}
          </small>

        </div>

      </div>
    `;

    box.appendChild(d);

  });
}

document.addEventListener(
  "input",
  function(e){

    if(
      e.target?.id==="dueSearch"
    ){

      renderDue();
    }

    if(
      e.target?.id==="equipmentSearch"
    ){

      renderEquipment();
    }

    if(
      e.target?.id==="stockSearch"
    ){

      renderProducts();
    }

  }
);
/* =========================
   METROLOGY
========================= */

function metrologyDurationMonths(item){
  const v=Number(item?.duration_months ?? item?.calibration_months ?? 12);
  return Number.isFinite(v)&&v>0?v:12;
}

function metrologyEndDate(item){
  if(!item?.calibration_date)return null;

  const d=new Date(item.calibration_date+"T00:00:00");
  if(Number.isNaN(d.getTime()))return null;

  d.setMonth(d.getMonth()+metrologyDurationMonths(item));
  return d;
}

function metrologyRemainingText(item){
  const end=metrologyEndDate(item);
  if(!end)return "غير محدد";

  const now=new Date();
  const diff=end.getTime()-now.getTime();
  const days=Math.ceil(diff/86400000);

  if(days<0)return `منتهية منذ ${Math.abs(days)} يوم`;
  if(days===0)return "تنتهي اليوم";
  if(days===1)return "باقي يوم واحد";
  if(days<30)return `باقي ${days} يوم`;

  const months=Math.floor(days/30);
  const rem=days%30;

  if(rem>0){
    return `باقي ${months} شهر و ${rem} يوم`;
  }

  return `باقي ${months} شهر`;
}

function metrologyStatus(item){
  const end=metrologyEndDate(item);
  if(!end)return "unknown";

  const days=Math.ceil((end.getTime()-Date.now())/86400000);

  if(days<0)return "expired";
  if(days<=30)return "soon";
  return "valid";
}

function metrologyStatusText(item){
  const s=metrologyStatus(item);

  if(s==="expired")return "منتهية";
  if(s==="soon")return "قريبة الانتهاء";
  if(s==="valid")return "صالحة";

  return "غير محدد";
}

async function loadMetrology(){
  try{
    if(!currentUser){
      metrology=[];
      renderMetrology();
      return;
    }

    const {data,error}=await db
      .from("metrology")
      .select("*")
      .eq("user_id",currentUser.id)
      .order("calibration_date",{ascending:false});

    if(error){
      console.error("loadMetrology error:",error);
      metrology=[];
      renderMetrology();
      return;
    }

    metrology=Array.isArray(data)?data:[];

    console.log("Metrology loaded:",metrology);

    renderMetrology();

  }catch(error){
    console.error("loadMetrology exception:",error);
    metrology=[];
    renderMetrology();
  }
}

function renderMetrology(){
  const box=document.getElementById("metrologyList");

  if(!box){
    console.warn("metrologyList غير موجود");
    return;
  }

  box.innerHTML="";

  if(!metrology.length){
    box.innerHTML=`
      <div class="info-box" style="text-align:center">
        📏 لا توجد معدات معايرة.
      </div>
    `;
    return;
  }

  metrology.forEach(item=>{
    const status=metrologyStatus(item);
    const end=metrologyEndDate(item);

    const d=document.createElement("div");
    d.className="product";

    d.innerHTML=`
      <div class="product-main">
        <div class="product-info">
          <div class="product-name">
            📏 ${safe(item.name || item.equipment_name || "معدات")}
          </div>

          <div class="product-meta">
            العامل:
            ${safe(item.worker_name || item.worker || "غير محدد")}
          </div>

          <div class="product-meta">
            تاريخ الطالوناج:
            ${safe(item.calibration_date || "-")}
          </div>

          <div class="product-meta">
            مدة المعايرة:
            ${metrologyDurationMonths(item)} شهر
          </div>

          <div class="product-meta">
            تاريخ الانتهاء:
            ${end ? end.toLocaleDateString("fr-FR") : "-"}
          </div>

          <div class="product-meta">
            ${safe(metrologyRemainingText(item))}
          </div>
        </div>

        <span class="status-badge ${
          status==="expired"
            ? "danger"
            : status==="soon"
              ? "warning"
              : "success"
        }">
          ${safe(metrologyStatusText(item))}
        </span>
      </div>

      <div class="product-actions">
        <button
          class="small-btn delete"
          type="button"
          onclick="deleteMetrology('${String(item.id || "")}')">
          🗑️ حذف
        </button>
      </div>
    `;

    box.appendChild(d);
  });
}

function openMetrology(){
  const modal=document.getElementById("metrologyModal");

  const worker=document.getElementById("metrologyWorker");
  const name=document.getElementById("metrologyName");
  const date=document.getElementById("calibrationDate");
  const duration=document.getElementById("calibrationDuration");

  if(worker)worker.value="";
  if(name)name.value="";
  if(date)date.value="";
  if(duration)duration.value="12";

  fillWorkerSelect("metrologyWorker");

  if(modal)modal.classList.add("show");
}

async function saveMetrology(e){
  if(e)e.preventDefault();

  if(!currentUser){
    toast("يجب تسجيل الدخول أولاً ❌");
    return;
  }

  try{
    const workerEl=document.getElementById("metrologyWorker");
    const nameEl=document.getElementById("metrologyName");
    const dateEl=document.getElementById("calibrationDate");
    const durationEl=document.getElementById("calibrationDuration");

    if(!nameEl || !dateEl){
      toast("خطأ في نموذج المعايرة ❌");
      return;
    }

    const workerId=workerEl?.value || null;
    const name=nameEl.value.trim();
    const calibrationDate=dateEl.value;
    const durationMonths=Number(durationEl?.value || 12);

    if(!name || !calibrationDate){
      toast("أدخل اسم المعدة وتاريخ الطالوناج ❌");
      return;
    }

    const selectedWorker=workers.find(
      w=>String(w.id)===String(workerId)
    );

    const obj={
      user_id:currentUser.id,
      worker_id:workerId,
      worker_name:selectedWorker?.name || "",
      name:name,
      calibration_date:calibrationDate,
      duration_months:
        Number.isFinite(durationMonths) && durationMonths>0
          ? durationMonths
          : 12
    };

    console.log("Adding metrology:",obj);

    const {data,error}=await db
      .from("metrology")
      .insert([obj])
      .select()
      .single();

    if(error){
      console.error("saveMetrology error:",error);
      toast("تعذر حفظ المعايرة: "+errText(error));
      return;
    }

    console.log("Metrology inserted:",data);

    closeModal("metrologyModal");

    await loadMetrology();

    renderDue();

    toast("تم حفظ بيانات المعايرة بنجاح ✅");

  }catch(error){
    console.error("saveMetrology exception:",error);
    toast("حدث خطأ أثناء حفظ المعايرة ❌");
  }
}

async function deleteMetrology(id){
  if(!id)return;

  if(!confirm("هل تريد حذف هذه المعايرة؟"))return;

  try{
    const {error}=await db
      .from("metrology")
      .delete()
      .eq("id",id)
      .eq("user_id",currentUser.id);

    if(error){
      console.error("deleteMetrology:",error);
      toast("تعذر حذف المعايرة ❌");
      return;
    }

    await loadMetrology();
    renderDue();

    toast("تم حذف المعايرة ✅");

  }catch(error){
    console.error(error);
    toast("حدث خطأ أثناء الحذف ❌");
  }
}


/* =========================
   MOVEMENTS
========================= */

async function loadMovements(){
  try{
    if(!currentUser){
      movements=[];
      renderMovements();
      return;
    }

    const {data,error}=await db
      .from("movements")
      .select("*")
      .eq("user_id",currentUser.id)
      .order("created_at",{ascending:false});

    if(error){
      console.error("loadMovements error:",error);
      movements=[];
      renderMovements();
      return;
    }

    movements=Array.isArray(data)?data:[];

    console.log("Movements loaded:",movements);

    renderMovements();

  }catch(error){
    console.error("loadMovements exception:",error);
    movements=[];
    renderMovements();
  }
}

function movementLabel(type){
  if(type==="entry")return "دخول";
  if(type==="exit")return "خروج";
  if(type==="return")return "إرجاع";
  if(type==="adjustment")return "تعديل";
  return type || "-";
}

function movementClass(type){
  if(type==="entry")return "success";
  if(type==="exit")return "danger";
  if(type==="return")return "warning";
  return "";
}

function renderMovements(){
  const box=document.getElementById("movementsList");

  if(!box){
    console.warn("movementsList غير موجود");
    return;
  }

  box.innerHTML="";

  if(!movements.length){
    box.innerHTML=`
      <div class="info-box" style="text-align:center">
        📋 لا توجد حركات.
      </div>
    `;
    return;
  }

  movements.forEach(m=>{
    const d=document.createElement("div");
    d.className="product";

    d.innerHTML=`
      <div class="product-main">
        <div class="product-info">

          <div class="product-name">
            ${safe(m.product_name || m.name || "منتج")}
          </div>

          <div class="product-meta">
            العامل:
            ${safe(m.worker_name || "-")}
          </div>

          <div class="product-meta">
            الكمية:
            ${safe(m.quantity ?? 0)}
          </div>

          <div class="product-meta">
            النوع:
            <span class="status-badge ${movementClass(m.type)}">
              ${safe(movementLabel(m.type))}
            </span>
          </div>

          <div class="product-meta">
            ${m.created_at
              ? new Date(m.created_at).toLocaleString("fr-FR")
              : "-"}
          </div>

        </div>
      </div>
    `;

    box.appendChild(d);
  });
}

function openMovement(type="entry"){
  movementType=type;

  const modal=document.getElementById("movementModal");

  const product=document.getElementById("movementProduct");
  const worker=document.getElementById("movementWorker");
  const quantity=document.getElementById("movementQuantity");

  if(product)product.value="";
  if(worker)worker.value="";
  if(quantity)quantity.value="1";

  fillWorkerSelect("movementWorker");

  if(typeof fillProductSelect==="function"){
    try{
      fillProductSelect("movementProduct");
    }catch(e){
      console.warn("fillProductSelect:",e);
    }
  }

  if(modal)modal.classList.add("show");
}

async function saveMovement(e){
  if(e)e.preventDefault();

  if(!currentUser){
    toast("يجب تسجيل الدخول أولاً ❌");
    return;
  }

  try{
    const productEl=document.getElementById("movementProduct");
    const workerEl=document.getElementById("movementWorker");
    const quantityEl=document.getElementById("movementQuantity");

    if(!productEl || !quantityEl){
      toast("خطأ في نموذج الحركة ❌");
      return;
    }

    const productId=productEl.value;
    const workerId=workerEl?.value || null;
    const quantity=Number(quantityEl.value);

    if(!productId){
      toast("اختر المنتج ❌");
      return;
    }

    if(!Number.isFinite(quantity) || quantity<=0){
      toast("أدخل كمية صحيحة ❌");
      return;
    }

    const product=products.find(
      p=>String(p.id)===String(productId)
    );

    if(!product){
      toast("المنتج غير موجود ❌");
      return;
    }

    const worker=workers.find(
      w=>String(w.id)===String(workerId)
    );

    const type=movementType || "entry";

    if(type==="exit"){
      const currentStock=Number(product.quantity || product.stock || 0);

      if(quantity>currentStock){
        toast("الكمية المطلوبة أكبر من المخزون ❌");
        return;
      }
    }

    const obj={
      user_id:currentUser.id,
      product_id:productId,
      product_name:product.name || "",
      worker_id:workerId,
      worker_name:worker?.name || "",
      quantity:quantity,
      type:type
    };

    console.log("Adding movement:",obj);

    const {data,error}=await db
      .from("movements")
      .insert([obj])
      .select()
      .single();

    if(error){
      console.error("saveMovement error:",error);
      toast("تعذر حفظ الحركة: "+errText(error));
      return;
    }

    console.log("Movement inserted:",data);

    let newQuantity=Number(product.quantity || product.stock || 0);

    if(type==="entry" || type==="return"){
      newQuantity+=quantity;
    }else if(type==="exit"){
      newQuantity-=quantity;
    }

    const quantityColumn =
      Object.prototype.hasOwnProperty.call(product,"quantity")
        ? "quantity"
        : "stock";

    const updateObj={};
    updateObj[quantityColumn]=newQuantity;

    const {error:updateError}=await db
      .from("products")
      .update(updateObj)
      .eq("id",productId)
      .eq("user_id",currentUser.id);

    if(updateError){
      console.error("product quantity update:",updateError);
      toast("تم تسجيل الحركة لكن تعذر تحديث المخزون ⚠️");
    }

    closeModal("movementModal");

    await loadProducts();
    await loadMovements();

    try{
      statistics();
    }catch(e){
      console.warn("statistics:",e);
    }

    toast("تم تسجيل الحركة بنجاح ✅");

  }catch(error){
    console.error("saveMovement exception:",error);
    toast("حدث خطأ أثناء حفظ الحركة ❌");
  }
}


/* =========================
   PRODUCTS
========================= */

function fillProductSelect(id){
  const select=document.getElementById(id);

  if(!select)return;

  select.innerHTML=
    `<option value="">اختر المنتج</option>`;

  products.forEach(p=>{
    const option=document.createElement("option");

    option.value=p.id;
    option.textContent=
      `${p.name || "منتج"} — المخزون: ${p.quantity ?? p.stock ?? 0}`;

    select.appendChild(option);
  });
}

function openProduct(){
  const modal=document.getElementById("productModal");

  const name=document.getElementById("productName");
  const quantity=document.getElementById("productQuantity");
  const min=document.getElementById("productMin");

  if(name)name.value="";
  if(quantity)quantity.value="0";
  if(min)min.value="0";

  if(modal)modal.classList.add("show");
}

async function saveProduct(e){
  if(e)e.preventDefault();

  if(!currentUser){
    toast("يجب تسجيل الدخول أولاً ❌");
    return;
  }

  try{
    const nameEl=document.getElementById("productName");
    const quantityEl=document.getElementById("productQuantity");
    const minEl=document.getElementById("productMin");

    if(!nameEl || !quantityEl){
      toast("خطأ في نموذج المنتج ❌");
      return;
    }

    const name=nameEl.value.trim();
    const quantity=Number(quantityEl.value || 0);
    const minStock=Number(minEl?.value || 0);

    if(!name){
      toast("أدخل اسم المنتج ❌");
      return;
    }

    if(!Number.isFinite(quantity) || quantity<0){
      toast("أدخل كمية صحيحة ❌");
      return;
    }

    const obj={
      user_id:currentUser.id,
      name:name,
      quantity:quantity,
      min_stock:
        Number.isFinite(minStock) && minStock>=0
          ? minStock
          : 0
    };

    const {data,error}=await db
      .from("products")
      .insert([obj])
      .select()
      .single();

    if(error){
      console.error("saveProduct:",error);
      toast("تعذر إضافة المنتج: "+errText(error));
      return;
    }

    console.log("Product inserted:",data);

    closeModal("productModal");

    await loadProducts();

    try{
      statistics();
    }catch(e){
      console.warn(e);
    }

    toast("تمت إضافة المنتج بنجاح ✅");

  }catch(error){
    console.error("saveProduct exception:",error);
    toast("حدث خطأ أثناء إضافة المنتج ❌");
  }
}

async function deleteProduct(id){
  if(!id)return;

  if(!confirm("هل تريد حذف هذا المنتج؟"))return;

  try{
    const {error}=await db
      .from("products")
      .delete()
      .eq("id",id)
      .eq("user_id",currentUser.id);

    if(error){
      console.error("deleteProduct:",error);
      toast("تعذر حذف المنتج ❌");
      return;
    }

    await loadProducts();

    toast("تم حذف المنتج ✅");

  }catch(error){
    console.error(error);
    toast("حدث خطأ أثناء حذف المنتج ❌");
  }
}


/* =========================
   DASHBOARD / STATISTICS
========================= */

function statistics(){
  const totalProducts=products.length;
  const totalWorkers=workers.length;
  const totalEquipment=equipment.length;
  const totalMetrology=metrology.length;

  const totalStock=products.reduce(
    (sum,p)=>sum+Number(p.quantity ?? p.stock ?? 0),
    0
  );

  const elProducts=document.getElementById("statProducts");
  const elWorkers=document.getElementById("statWorkers");
  const elEquipment=document.getElementById("statEquipment");
  const elStock=document.getElementById("statStock");
  const elMetrology=document.getElementById("statMetrology");

  if(elProducts)elProducts.textContent=totalProducts;
  if(elWorkers)elWorkers.textContent=totalWorkers;
  if(elEquipment)elEquipment.textContent=totalEquipment;
  if(elStock)elStock.textContent=totalStock;
  if(elMetrology)elMetrology.textContent=totalMetrology;

  if(typeof updateStats==="function"){
    try{updateStats()}catch(e){console.warn(e)}
  }
}

function updateDashboard(){
  statistics();
  renderDue();
}

function updateTodayStats(){
  const today=new Date().toISOString().slice(0,10);

  const todayMovements=movements.filter(m=>{
    if(!m.created_at)return false;
    return String(m.created_at).slice(0,10)===today;
  });

  const entries=todayMovements
    .filter(m=>m.type==="entry")
    .reduce((s,m)=>s+Number(m.quantity||0),0);

  const exits=todayMovements
    .filter(m=>m.type==="exit")
    .reduce((s,m)=>s+Number(m.quantity||0),0);

  const elEntry=document.getElementById("todayEntries");
  const elExit=document.getElementById("todayExits");

  if(elEntry)elEntry.textContent=entries;
  if(elExit)elExit.textContent=exits;
}

function updateDueItems(){
  renderDue();
}


/* =========================
   HOME PRODUCTS
========================= */

function renderHomeProducts(){
  const box=document.getElementById("homeProducts");

  if(!box)return;

  box.innerHTML="";

  const list=products.slice(0,6);

  if(!list.length){
    box.innerHTML=`
      <div class="info-box" style="text-align:center">
        لا توجد منتجات.
      </div>
    `;
    return;
  }

  list.forEach(p=>{
    const quantity=Number(p.quantity ?? p.stock ?? 0);
    const min=Number(p.min_stock || 0);

    const d=document.createElement("div");
    d.className="product";

    d.innerHTML=`
      <div class="product-main">
        <div class="product-info">
          <div class="product-name">
            ${safe(p.name || "منتج")}
          </div>
          <div class="product-meta">
            الكمية: ${quantity}
          </div>
        </div>

        <span class="status-badge ${
          quantity<=min ? "danger" : "success"
        }">
          ${quantity<=min ? "مخزون منخفض" : "متوفر"}
        </span>
      </div>
    `;

    box.appendChild(d);
  });
}


/* =========================
   LOAD ALL DATA
========================= */

async function loadAll(){
  if(!currentUser){
    console.warn("loadAll: لا يوجد مستخدم");
    return;
  }

  try{
    await Promise.all([
      loadProducts(),
      loadWorkers(),
      loadEquipment(),
      loadMetrology(),
      loadMovements()
    ]);

    statistics();
    renderDue();
    renderEquipment();
    renderMetrology();
    renderWorkers();
    renderMovements();
    renderHomeProducts();
    updateTodayStats();

  }catch(error){
    console.error("loadAll error:",error);
  }
}


/* =========================
   REFRESH APP DATA
========================= */

async function refreshAppData(){
  try{
    const status=document.getElementById("refreshStatus");

    if(status){
      status.textContent="🔄 جاري تحديث البيانات...";
      status.style.display="block";
    }

    if(!currentUser){
      if(status){
        status.textContent="⚠️ يجب تسجيل الدخول";
      }
      return;
    }

    await Promise.all([
      loadProducts(),
      loadWorkers(),
      loadEquipment(),
      loadMetrology(),
      loadMovements()
    ]);

    statistics();
    renderDue();
    renderWorkers();
    renderEquipment();
    renderMetrology();
    renderMovements();
    renderHomeProducts();
    updateTodayStats();

    if(status){
      status.textContent="✅ تم تحديث البيانات";

      setTimeout(()=>{
        status.style.display="none";
      },2000);
    }

  }catch(error){
    console.error("refreshAppData:",error);

    const status=document.getElementById("refreshStatus");

    if(status){
      status.textContent="❌ فشل تحديث البيانات";
    }
  }
}

window.refreshAppData=refreshAppData;


/* =========================
   SEARCH
========================= */

document.addEventListener("input",function(e){

  if(e.target?.id==="workerSearch"){
    renderWorkers();
  }

  if(e.target?.id==="productSearch"){
    if(typeof renderProducts==="function"){
      renderProducts();
    }
  }

  if(e.target?.id==="equipmentSearch"){
    if(typeof renderEquipment==="function"){
      renderEquipment();
    }
  }

  if(e.target?.id==="movementSearch"){
    if(typeof renderMovements==="function"){
      renderMovements();
    }
  }
});


/* =========================
   VISIBILITY / FOCUS
========================= */

document.addEventListener(
  "visibilitychange",
  ()=>{
    if(!document.hidden && currentUser){
      refreshAppData();
    }
  }
);

window.addEventListener(
  "focus",
  ()=>{
    if(currentUser){
      refreshAppData();
    }
  }
);


/* =========================
   AUTO REFRESH
========================= */

setInterval(()=>{
  if(currentUser){
    refreshAppData();
  }
},60000);


/* =========================
   MODAL CLOSE
========================= */

document.addEventListener("click",function(e){

  if(e.target.classList?.contains("modal")){
    e.target.classList.remove("show");
  }

});


/* =========================
   ESC CLOSE
========================= */

document.addEventListener("keydown",function(e){

  if(e.key!=="Escape")return;

  document
    .querySelectorAll(".modal.show")
    .forEach(modal=>{
      modal.classList.remove("show");
    });

});


/* =========================
   PWA INSTALL
========================= */

window.addEventListener(
  "beforeinstallprompt",
  e=>{
    e.preventDefault();

    deferredPrompt=e;

    const btn=document.getElementById("installBtn");

    if(btn){
      btn.style.display="inline-flex";
    }
  }
);

async function installApp(){

  if(!deferredPrompt){
    toast("التطبيق مثبت أو التثبيت غير متاح حالياً ℹ️");
    return;
  }

  deferredPrompt.prompt();

  try{
    await deferredPrompt.userChoice;
  }catch(e){
    console.warn(e);
  }

  deferredPrompt=null;

  const btn=document.getElementById("installBtn");

  if(btn){
    btn.style.display="none";
  }
}

window.installApp=installApp;


/* =========================
   SERVICE WORKER
========================= */

if("serviceWorker" in navigator){

  window.addEventListener(
    "load",
    ()=>{
      navigator.serviceWorker
        .register("./sw.js")
        .then(reg=>{
          console.log("Service Worker registered:",reg);

          if(reg.waiting){
            console.log("New service worker waiting");
          }
        })
        .catch(error=>{
          console.warn("Service Worker:",error);
        });
    }
  );

}


/* =========================
   INITIAL START
========================= */

window.addEventListener("load",async()=>{

  try{

    console.log("Stock Pro v2.5 starting...");

    await checkSession();

  }catch(error){

    console.error(
      "Initial application error:",
      error
    );

  }

});
/* =========================
   AUTHENTICATION
========================= */

async function checkSession(){
  try{
    const {data,error}=await db.auth.getSession();

    if(error){
      console.error("getSession:",error);
      showLogin();
      return;
    }

    const session=data?.session;

    if(session?.user){
      currentUser=session.user;
      await applyUser();
    }else{
      currentUser=null;
      showLogin();
    }

  }catch(error){
    console.error("checkSession:",error);
    showLogin();
  }
}

async function login(e){
  if(e)e.preventDefault();

  const emailEl=document.getElementById("loginEmail");
  const passwordEl=document.getElementById("loginPassword");

  if(!emailEl || !passwordEl){
    toast("خطأ في نموذج تسجيل الدخول ❌");
    return;
  }

  const email=emailEl.value.trim();
  const password=passwordEl.value;

  if(!email || !password){
    toast("أدخل البريد الإلكتروني وكلمة المرور ❌");
    return;
  }

  try{
    const {data,error}=await db.auth.signInWithPassword({
      email,
      password
    });

    if(error){
      console.error("login:",error);
      toast("البريد الإلكتروني أو كلمة المرور غير صحيحة ❌");
      return;
    }

    currentUser=data.user;

    await applyUser();

    toast("تم تسجيل الدخول بنجاح ✅");

  }catch(error){
    console.error("login exception:",error);
    toast("حدث خطأ أثناء تسجيل الدخول ❌");
  }
}

async function logout(){
  try{

    const {error}=await db.auth.signOut();

    if(error){
      console.error("logout:",error);
    }

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

  }catch(error){
    console.error("logout exception:",error);
    showLogin();
  }
}

async function applyUser(){
  if(!currentUser){
    showLogin();
    return;
  }

  try{
    isAdmin=
      String(currentUser.email||"").toLowerCase()===
      String(ADMIN_EMAIL).toLowerCase();

    const adminBtn=document.getElementById("adminMenu");

    if(adminBtn){
      adminBtn.style.display=isAdmin
        ? "block"
        : "none";
    }

    showApp();

    await loadAll();

  }catch(error){
    console.error("applyUser:",error);
  }
}


/* =========================
   LOGIN / APP UI
========================= */

function showLogin(){

  const loginPage=document.getElementById("loginPage");
  const app=document.getElementById("app");

  if(loginPage){
    loginPage.style.display="flex";
  }

  if(app){
    app.style.display="none";
  }
}

function showApp(){

  const loginPage=document.getElementById("loginPage");
  const app=document.getElementById("app");

  if(loginPage){
    loginPage.style.display="none";
  }

  if(app){
    app.style.display="block";
  }

  try{
    changeLanguage(
      localStorage.getItem("stockProLanguage") || "ar"
    );
  }catch(error){
    console.warn("changeLanguage:",error);
  }
}


/* =========================
   AUTH STATE CHANGE
========================= */

db.auth.onAuthStateChange(
  async(event,session)=>{

    console.log(
      "Auth event:",
      event,
      session?.user?.email || "none"
    );

    if(session?.user){

      currentUser=session.user;

      await applyUser();

    }else{

      currentUser=null;
      isAdmin=false;

      showLogin();

    }
  }
);


/* =========================
   USERS / ADMIN
========================= */

async function loadUsers(){

  if(!isAdmin){
    users=[];
    renderUsers();
    return;
  }

  try{

    const {data,error}=await db
      .from("profiles")
      .select("*")
      .order("created_at",{ascending:false});

    if(error){
      console.error("loadUsers:",error);
      users=[];
      renderUsers();
      return;
    }

    users=Array.isArray(data)?data:[];

    renderUsers();

  }catch(error){

    console.error("loadUsers exception:",error);

    users=[];

    renderUsers();
  }
}

function renderUsers(){

  const box=document.getElementById("usersList");

  if(!box)return;

  box.innerHTML="";

  if(!users.length){

    box.innerHTML=`
      <div class="info-box" style="text-align:center">
        لا توجد حسابات.
      </div>
    `;

    return;
  }

  users.forEach(user=>{

    const d=document.createElement("div");

    d.className="product";

    const email=user.email || "-";
    const role=user.role || "worker";
    const blocked=!!user.is_blocked;

    d.innerHTML=`
      <div class="product-main">

        <div class="product-info">

          <div class="product-name">
            👤 ${safe(email)}
          </div>

          <div class="product-meta">
            الدور:
            ${role==="admin" ? "مدير" : "عامل"}
          </div>

          <div class="product-meta">
            الحالة:
            ${blocked ? "محظور" : "نشط"}
          </div>

        </div>

        <span class="status-badge ${
          blocked ? "danger" : "success"
        }">
          ${blocked ? "محظور" : "نشط"}
        </span>

      </div>

      ${
        String(email).toLowerCase()===
        String(MASTER_ADMIN_EMAIL).toLowerCase()
        ? ""
        : `
          <div class="product-actions">

            <button
              class="small-btn"
              type="button"
              onclick="toggleUserBlock('${String(user.id||"")}',${
                blocked ? "false" : "true"
              })">
              ${blocked ? "🔓 فك الحظر" : "🔒 حظر"}
            </button>

          </div>
        `
      }
    `;

    box.appendChild(d);

  });
}

async function toggleUserBlock(id,value){

  if(!isAdmin)return;

  if(!id)return;

  try{

    const {error}=await db
      .from("profiles")
      .update({
        is_blocked:!!value
      })
      .eq("id",id);

    if(error){

      console.error(
        "toggleUserBlock:",
        error
      );

      toast("تعذر تغيير حالة الحساب ❌");

      return;
    }

    await loadUsers();

    toast(
      value
        ? "تم حظر الحساب 🔒"
        : "تم فك الحظر 🔓"
    );

  }catch(error){

    console.error(error);

    toast("حدث خطأ ❌");
  }
}


/* =========================
   BACKUP
========================= */

async function backupData(){

  if(!currentUser){

    toast("يجب تسجيل الدخول أولاً ❌");

    return;
  }

  try{

    const backup={

      app:"Stock Pro",

      version:"2.5",

      created_at:new Date().toISOString(),

      user_id:currentUser.id,

      data:{
        products,
        workers,
        equipment,
        metrology,
        movements
      }

    };

    const json=JSON.stringify(
      backup,
      null,
      2
    );

    const blob=new Blob(
      [json],
      {type:"application/json"}
    );

    const url=URL.createObjectURL(blob);

    const a=document.createElement("a");

    a.href=url;

    a.download=
      `stock-pro-backup-${new Date()
        .toISOString()
        .slice(0,10)}.json`;

    document.body.appendChild(a);

    a.click();

    a.remove();

    URL.revokeObjectURL(url);

    toast("تم إنشاء النسخة الاحتياطية ✅");

  }catch(error){

    console.error(
      "backupData:",
      error
    );

    toast("تعذر إنشاء النسخة الاحتياطية ❌");
  }
}


/* =========================
   RESTORE
========================= */

function openRestore(){

  const input=
    document.getElementById("restoreFile");

  if(input){

    input.value="";

    input.click();

  }else{

    toast("ملف الاسترجاع غير موجود ❌");

  }
}

async function restoreData(e){

  const file=
    e?.target?.files?.[0];

  if(!file){

    toast("اختر ملف النسخة الاحتياطية ❌");

    return;
  }

  if(!currentUser){

    toast("يجب تسجيل الدخول أولاً ❌");

    return;
  }

  try{

    const textData=
      await file.text();

    const backup=
      JSON.parse(textData);

    if(
      !backup ||
      backup.app!=="Stock Pro" ||
      !backup.data
    ){

      toast("ملف النسخة الاحتياطية غير صالح ❌");

      return;
    }

    if(
      backup.user_id &&
      String(backup.user_id)!==
      String(currentUser.id)
    ){

      toast(
        "هذه النسخة الاحتياطية تخص حساباً آخر ❌"
      );

      return;
    }

    const data=backup.data;

    const tables=[
      ["products",data.products],
      ["workers",data.workers],
      ["equipment",data.equipment],
      ["metrology",data.metrology],
      ["movements",data.movements]
    ];

    for(const [table,rows] of tables){

      if(!Array.isArray(rows) || !rows.length){
        continue;
      }

      const cleaned=rows.map(row=>{

        const copy={
          ...row
        };

        delete copy.id;
        delete copy.created_at;
        delete copy.updated_at;

        copy.user_id=currentUser.id;

        return copy;
      });

      const {error}=await db
        .from(table)
        .insert(cleaned);

      if(error){

        console.error(
          `restore ${table}:`,
          error
        );

        toast(
          `تعذر استرجاع ${table} ❌`
        );

        return;
      }
    }

    await loadAll();

    toast(
      "تم استرجاع البيانات بنجاح ✅"
    );

  }catch(error){

    console.error(
      "restoreData:",
      error
    );

    toast(
      "ملف النسخة الاحتياطية غير صالح ❌"
    );

  }finally{

    if(e?.target){
      e.target.value="";
    }

  }
}


/* =========================
   SETTINGS
========================= */

function loadSettings(){

  try{

    const theme=
      localStorage.getItem(
        "stockProTheme"
      ) || "dark";

    applyTheme(theme);

  }catch(error){

    console.warn(
      "loadSettings:",
      error
    );

  }
}

function applyTheme(theme){

  document.body.classList.toggle(
    "light-theme",
    theme==="light"
  );

  localStorage.setItem(
    "stockProTheme",
    theme
  );

  const btn=
    document.getElementById("themeToggle");

  if(btn){

    btn.textContent=
      theme==="light"
        ? "🌙"
        : "☀️";

  }
}

function toggleTheme(){

  const light=
    document.body.classList.contains(
      "light-theme"
    );

  applyTheme(
    light
      ? "dark"
      : "light"
  );
}


/* =========================
   LANGUAGE
========================= */

const LANGUAGES={
  ar:{
    dir:"rtl",
    title:"Stock Pro"
  },

  fr:{
    dir:"ltr",
    title:"Stock Pro"
  },

  en:{
    dir:"ltr",
    title:"Stock Pro"
  }
};

function changeLanguage(lang){

  if(!LANGUAGES[lang]){
    lang="ar";
  }

  const config=
    LANGUAGES[lang];

  document.documentElement.lang=lang;

  document.documentElement.dir=
    config.dir;

  localStorage.setItem(
    "stockProLanguage",
    lang
  );

  currentLanguage=lang;

  try{

    renderWorkers();

    renderEquipment();

    renderMetrology();

    renderMovements();

    renderHomeProducts();

  }catch(error){

    console.warn(
      "changeLanguage render:",
      error
    );

  }
}


/* =========================
   EXPORT DATA
========================= */

function exportJSON(){

  return backupData();

}


/* =========================
   HELPERS
========================= */

function safe(value){

  return String(
    value ?? ""
  )
  .replace(/&/g,"&amp;")
  .replace(/</g,"&lt;")
  .replace(/>/g,"&gt;")
  .replace(/"/g,"&quot;")
  .replace(/'/g,"&#039;");
}

function errText(error){

  if(!error){
    return "خطأ غير معروف";
  }

  return (
    error.message ||
    error.details ||
    error.hint ||
    "خطأ غير معروف"
  );
}

function toast(message){

  const old=
    document.querySelector(
      ".toast"
    );

  if(old){
    old.remove();
  }

  const el=
    document.createElement("div");

  el.className="toast";

  el.textContent=
    message;

  document.body.appendChild(el);

  setTimeout(()=>{

    el.classList.add("hide");

    setTimeout(()=>{
      el.remove();
    },300);

  },3000);
}

function closeModal(id){

  const modal=
    document.getElementById(id);

  if(modal){

    modal.classList.remove(
      "show"
    );

  }
}

function openPage(id){

  document
    .querySelectorAll(".page")
    .forEach(page=>{
      page.classList.remove(
        "active"
      );
    });

  const page=
    document.getElementById(id);

  if(page){

    page.classList.add(
      "active"
    );

  }

  document
    .querySelectorAll(
      ".nav-item"
    )
    .forEach(item=>{
      item.classList.remove(
        "active"
      );
    });

  const nav=
    document.querySelector(
      `[data-page="${id}"]`
    );

  if(nav){

    nav.classList.add(
      "active"
    );

  }

  window.scrollTo({
    top:0,
    behavior:"smooth"
  });

  if(id==="workers"){
    renderWorkers();
  }

  if(id==="equipment"){
    renderEquipment();
  }

  if(id==="metrology"){
    renderMetrology();
  }

  if(id==="movements"){
    renderMovements();
  }

  if(id==="home"){
    renderHomeProducts();
    statistics();
  }
}


/* =========================
   GLOBAL FUNCTIONS
========================= */

window.login=login;
window.logout=logout;

window.openWorker=openWorker;
window.saveWorker=saveWorker;
window.deleteWorker=deleteWorker;

window.openEquipment=openEquipment;
window.saveEquipment=saveEquipment;
window.deleteEquipment=deleteEquipment;

window.openMetrology=openMetrology;
window.saveMetrology=saveMetrology;
window.deleteMetrology=deleteMetrology;

window.openMovement=openMovement;
window.saveMovement=saveMovement;

window.openProduct=openProduct;
window.saveProduct=saveProduct;
window.deleteProduct=deleteProduct;

window.loadWorkers=loadWorkers;
window.refreshWorkers=refreshWorkers;

window.loadEquipment=loadEquipment;
window.loadMetrology=loadMetrology;
window.loadMovements=loadMovements;
window.loadProducts=loadProducts;

window.renderWorkers=renderWorkers;
window.renderEquipment=renderEquipment;
window.renderMetrology=renderMetrology;
window.renderMovements=renderMovements;

window.loadAll=loadAll;
window.refreshAppData=refreshAppData;

window.statistics=statistics;
window.updateDashboard=updateDashboard;
window.updateTodayStats=updateTodayStats;
window.updateDueItems=updateDueItems;

window.loadUsers=loadUsers;
window.renderUsers=renderUsers;
window.toggleUserBlock=toggleUserBlock;

window.backupData=backupData;
window.restoreData=restoreData;
window.openRestore=openRestore;
window.exportJSON=exportJSON;

window.applyTheme=applyTheme;
window.toggleTheme=toggleTheme;
window.changeLanguage=changeLanguage;

window.installApp=installApp;
window.openPage=openPage;
window.closeModal=closeModal;


/* =========================
   STARTUP
========================= */

document.addEventListener(
  "DOMContentLoaded",
  ()=>{
    try{

      loadSettings();

      const lang=
        localStorage.getItem(
          "stockProLanguage"
        ) || "ar";

      changeLanguage(lang);

    }catch(error){

      console.error(
        "DOMContentLoaded:",
        error
      );
    }
  }
);


/* =========================
   FINAL REFRESH
========================= */

setTimeout(()=>{

  if(currentUser){

    refreshAppData();

  }

},1500);

console.log(
  "✅ Stock Pro v2.5 app.js loaded successfully"
);
