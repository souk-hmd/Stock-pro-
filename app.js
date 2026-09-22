// Stock Pro v2.5 - Workers Fixed
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
function safe(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;")}
function errText(e){return e?.message||e?.error_description||"خطأ غير معروف"}
function toast(m){const e=document.getElementById("toast");e.textContent=m;e.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>e.classList.remove("show"),3000)}
function showLogin(){document.getElementById("loginScreen").style.display="flex";document.getElementById("app").style.display="none";updateInstallButton()}
function isMasterAdmin(){return String(currentUser?.email||"").toLowerCase()===MASTER_ADMIN_EMAIL.toLowerCase()}
function showApp(){document.getElementById("loginScreen").style.display="none";document.getElementById("app").style.display="block";const se=document.getElementById("settingsEmail");if(se)se.textContent=currentUser?.email||"";const ls=document.getElementById("languageSelect");if(ls)ls.value=currentLanguage;updateInstallButton();changeLanguage(currentLanguage);document.getElementById("adminNav").classList.toggle("show",isMasterAdmin())}
function showLoginError(m){const e=document.getElementById("loginError");e.textContent=m;e.style.display="block"}
function togglePassword(){const e=document.getElementById("loginPassword"),i=document.getElementById("passwordEye");e.type=e.type==="password"?"text":"password";if(i)i.textContent=e.type==="password"?"👁️":"🙈"}
async function getProfile(user){const {data,error}=await db.from("profiles").select("*").eq("id",user.id).maybeSingle();if(error){console.warn("profiles:",error.message);return null}return data}
async function applyUser(user){
  currentUser=user;const p=await getProfile(user);
  const temporaryExpired=p?.blocked_until&&new Date(p.blocked_until).getTime()<=Date.now();
  if(temporaryExpired&&p?.is_blocked===true){await db.from("profiles").update({is_blocked:false,blocked_until:null}).eq("id",user.id);p.is_blocked=false;}
  isAdmin=user.email?.toLowerCase()===ADMIN_EMAIL.toLowerCase()||p?.role==="admin";
  if(p?.is_blocked===true||p?.blocked===true){await db.auth.signOut();currentUser=null;isAdmin=false;showLogin();showLoginError(p?.blocked_until?"هذا الحساب موقوف مؤقتًا من طرف الإدارة.":"هذا الحساب محظور من طرف الإدارة.");return false}
  showApp();if(isAdmin)setTimeout(loadUsers,100);return true
}
let currentLanguage=localStorage.getItem("stockpro_language")||"ar";

const I18N={
 ar:{home:"الرئيسية",products:"المنتجات",workers:"العمال",equipment:"التجهيزات",duePage:"المستحقون",reports:"التقارير",settings:"الإعدادات",users:"إدارة المستخدمين",welcome:"مرحباً بك 👋",headerTitle:"إدارة المخزون والعمال والتجهيزات",quick:"العمليات السريعة",addProduct:"إضافة منتج",newMaterial:"مادة جديدة",stockIn:"دخول المخزون",stockOut:"خروج المخزون",bonIn:"Bon d'entrée",bonOut:"Bon de sortie",issueEquipment:"تسليم تجهيز",epi:"EPI / Vêtements",latestProducts:"آخر المنتجات",showAll:"عرض الكل",searchProduct:"ابحث عن منتج أو مرجع...",searchWorker:"ابحث بالـ Matricule أو الاسم...",searchEquipment:"ابحث بالـ Matricule أو اسم العامل...",searchDue:"ابحث بالـ Matricule أو اسم العامل...",searchUser:"بحث بالاسم...",add:"+ إضافة",workerAdd:"+ عامل",issueAdd:"+ تسليم",refresh:"↻ تحديث",quantity:"الكمية",category:"الفئة",reference:"المرجع",lastIssue:"آخر تسليم",dueDate:"تاريخ الاستحقاق",due:"مستحق",notDue:"غير مستحق",soon:"قريب من الاستحقاق",notIssued:"لم يُسلّم",remaining:"باقي",month:"شهر",months:"أشهر",day:"يوم",days:"أيام",today:"مستحق اليوم",overdue:"متأخر",developer:"المطور",account:"👤 الحساب",logout:"🚪 تسجيل الخروج",language:"لغة التطبيق",currentAccount:"الحساب الحالي",developerTitle:"👨‍💻 المطور",active:"نشط",inactive:"غير نشط",admin:"ADMIN",worker:"WORKER",blocked:"موقوف",noData:"لا توجد بيانات.",noProducts:"لا توجد منتجات.",noWorkers:"لا يوجد عمال.",noEquipment:"لا توجد بيانات تجهيزات.",noDue:"لا توجد استحقاقات حالياً."},
 fr:{home:"Accueil",products:"Articles",workers:"Travailleurs",equipment:"Équipements",duePage:"Éligibilités",reports:"Rapports",settings:"Paramètres",users:"Gestion des utilisateurs",welcome:"Bienvenue 👋",headerTitle:"Gestion du stock, des travailleurs et des équipements",quick:"Actions rapides",addProduct:"Ajouter un article",newMaterial:"Nouvelle matière",stockIn:"Entrée stock",stockOut:"Sortie stock",bonIn:"Bon d'entrée",bonOut:"Bon de sortie",issueEquipment:"Remise équipement",epi:"EPI / Vêtements",latestProducts:"Derniers articles",showAll:"Tout afficher",searchProduct:"Rechercher un article ou une référence...",searchWorker:"Rechercher par matricule ou nom...",searchEquipment:"Rechercher par matricule ou nom...",searchDue:"Rechercher par matricule ou nom...",searchUser:"Rechercher par nom...",add:"+ Ajouter",workerAdd:"+ Travailleur",issueAdd:"+ Remise",refresh:"↻ Actualiser",quantity:"Quantité",category:"Famille",reference:"Référence",lastIssue:"Dernière remise",dueDate:"Date d'échéance",due:"Éligible",notDue:"Non éligible",soon:"Échéance proche",notIssued:"Non remis",remaining:"Reste",month:"mois",months:"mois",day:"jour",days:"jours",today:"Éligible aujourd'hui",overdue:"En retard",developer:"Développeur",account:"👤 Compte",logout:"🚪 Déconnexion",language:"Langue de l'application",currentAccount:"Compte actuel",developerTitle:"👨‍💻 Développeur",active:"Actif",inactive:"Inactif",admin:"ADMIN",worker:"TRAVAILLEUR",blocked:"Suspendu",noData:"Aucune donnée.",noProducts:"Aucun article.",noWorkers:"Aucun travailleur.",noEquipment:"Aucun équipement.",noDue:"Aucune échéance actuellement."},
 en:{home:"Home",products:"Products",workers:"Workers",equipment:"Equipment",duePage:"Due items",reports:"Reports",settings:"Settings",users:"User management",welcome:"Welcome 👋",headerTitle:"Stock, workers and equipment management",quick:"Quick actions",addProduct:"Add product",newMaterial:"New material",stockIn:"Stock entry",stockOut:"Stock exit",bonIn:"Entry voucher",bonOut:"Exit voucher",issueEquipment:"Issue equipment",epi:"PPE / Clothing",latestProducts:"Latest products",showAll:"Show all",searchProduct:"Search product or reference...",searchWorker:"Search by matricule or name...",searchEquipment:"Search by matricule or worker name...",searchDue:"Search by matricule or worker name...",searchUser:"Search by name...",add:"+ Add",workerAdd:"+ Worker",issueAdd:"+ Issue",refresh:"↻ Refresh",quantity:"Quantity",category:"Family",reference:"Reference",lastIssue:"Last issue",dueDate:"Due date",due:"Due",notDue:"Not due",soon:"Due soon",notIssued:"Not issued",remaining:"Remaining",month:"month",months:"months",day:"day",days:"days",today:"Due today",overdue:"Overdue",developer:"Developer",account:"👤 Account",logout:"🚪 Log out",language:"Application language",currentAccount:"Current account",developerTitle:"👨‍💻 Developer",active:"Active",inactive:"Inactive",admin:"ADMIN",worker:"WORKER",blocked:"Blocked",noData:"No data.",noProducts:"No products.",noWorkers:"No workers.",noEquipment:"No equipment.",noDue:"No due items currently."}
};
function tr(k){return (I18N[currentLanguage]||I18N.ar)[k]||I18N.ar[k]||k}
function equipmentLabel(t){return ({shoes:{ar:"حذاء حماية",fr:"Chaussures de sécurité",en:"Safety shoes"},bleu:{ar:"ملابس العمل",fr:"Bleu de travail",en:"Work clothes"},glasses:{ar:"نظارات حماية",fr:"Lunettes de sécurité",en:"Safety glasses"},gants:{ar:"قفازات",fr:"Gants",en:"Gloves"},vest_soudeur:{ar:"سترة لحام",fr:"Vest soudeur",en:"Welding vest"}}[t]||{})[currentLanguage]||t}
function statusText(s){return s==="due"?tr("due"):s==="soon"?tr("soon"):s==="notdue"?tr("notDue"):tr("notIssued")}
function remainingText(date){if(!date)return tr("notIssued");const diff=dueDiffDays(date);if(diff<=0)return diff===0?tr("today"):`${tr("overdue")} ${Math.abs(diff)} ${Math.abs(diff)===1?tr("day"):tr("days")}`;const a=new Date(todayKey()+"T00:00:00"),b=new Date(date+"T00:00:00");let months=(b.getFullYear()-a.getFullYear())*12+(b.getMonth()-a.getMonth());let anchor=new Date(a);anchor.setMonth(anchor.getMonth()+months);if(anchor>b){months--;anchor=new Date(a);anchor.setMonth(anchor.getMonth()+months)}const days=Math.floor((b-anchor)/86400000);let parts=[];if(months===1)parts.push(`1 ${tr("month")}`);else if(months>1)parts.push(`${months} ${tr("months")}`);if(days>0)parts.push(`${days} ${days===1?tr("day"):tr("days")}`);return `${tr("remaining")} ${parts.join(currentLanguage==="ar"?" و ":" ")}`}
function translateApp(){
 const map={products:"products",workers:"workers",equipment:"equipment",due:"duePage",reports:"reports",settings:"settings",admin:"users",quick:"quick",addProduct:"addProduct",newMaterial:"newMaterial",stockIn:"stockIn",stockOut:"stockOut",issueEquipment:"issueEquipment",latestProducts:"latestProducts",showAll:"showAll",quantity:"quantity",category:"category",reference:"reference",account:"account",logout:"logout",language:"language",developerTitle:"developerTitle"};
 document.querySelectorAll("[data-i18n]").forEach(e=>{const k=e.dataset.i18n;e.textContent=tr(k)});
 document.querySelectorAll("input[placeholder]").forEach(e=>{if(e.id==="stockSearch")e.placeholder=tr("searchProduct");if(e.id==="workerSearch")e.placeholder=tr("searchWorker");if(e.id==="equipmentSearch")e.placeholder=tr("searchEquipment");if(e.id==="dueSearch")e.placeholder=tr("searchDue");if(e.id==="userSearch")e.placeholder=tr("searchUser")});
 const dev=document.getElementById("developerLabel");if(dev)dev.textContent=tr("developer");const loginDev=document.getElementById("loginDeveloperLabel");if(loginDev)loginDev.textContent=tr("developer");
}
function changeLanguage(lang){currentLanguage=lang;localStorage.setItem("stockpro_language",lang);document.documentElement.lang=lang;document.documentElement.dir=lang==="ar"?"rtl":"ltr";const ls=document.getElementById("languageSelect");if(ls)ls.value=lang;translateApp();renderProducts();renderWorkers();renderEquipment();renderDue();if(isMasterAdmin())renderUsers();updateInstallButton();}
function isAppInstalled(){return window.matchMedia("(display-mode: standalone)").matches||window.matchMedia("(display-mode: fullscreen)").matches||window.matchMedia("(display-mode: minimal-ui)").matches||window.navigator.standalone===true;}
function updateInstallButton(){
  const installed=isAppInstalled();
  const canInstall=!!deferredPrompt;
  const show=!installed;

  const home=document.getElementById("homeInstallBox");
  const login=document.getElementById("loginInstallButton");
  const settings=document.getElementById("installButton");
  const homeBtn=document.getElementById("homeInstallButton");
  const help=document.getElementById("installHelp");
  const loginHelp=document.getElementById("loginInstallHelp");

  if(home) home.style.display=show?"block":"none";
  if(login) login.style.display=show?"block":"none";
  if(settings) settings.style.display=show?"block":"none";

  const text=canInstall
    ?"📲 تثبيت التطبيق"
    :"📲 تحميل التطبيق";

  if(homeBtn) homeBtn.textContent=text;
  if(login) login.textContent=text;
  if(settings) settings.textContent=canInstall
    ?"📲 تثبيت Stock Pro على الهاتف"
    :"📲 تحميل Stock Pro على الهاتف";

  const helpText=canInstall
    ?"اضغط هنا لتثبيت Stock Pro على هاتفك."
    ?"إذا لم تظهر نافذة التثبيت، افتح قائمة المتصفح واختر «إضافة إلى الشاشة الرئيسية».";

  if(help) help.textContent=helpText;
  if(loginHelp) loginHelp.textContent=helpText;
}

async function checkSession(){const {data,error}=await db.auth.getSession();if(error){showLogin();return}if(data.session){if(await applyUser(data.session.user))await loadAll()}else showLogin()}
function authErrorArabic(error){
  const code=String(error?.code||"").toLowerCase();
  const msg=String(error?.message||"").toLowerCase();
  if(code.includes("invalid_credentials")||msg.includes("invalid login credentials")) return "البريد الإلكتروني أو كلمة السر غير صحيحة.";
  if(code.includes("email_not_confirmed")||msg.includes("email not confirmed")) return "هذا البريد الإلكتروني غير مؤكد في Supabase.";
  if(code.includes("user_not_found")||msg.includes("user not found")) return "لا يوجد حساب بهذا البريد الإلكتروني.";
  if(code.includes("too_many_requests")||msg.includes("rate limit")) return "تم تجاوز عدد محاولات الدخول. انتظر قليلًا ثم أعد المحاولة.";
  if(code.includes("network")||msg.includes("fetch")) return "تعذر الاتصال بالخادم. تحقق من الإنترنت ثم أعد المحاولة.";
  if(msg.includes("email")&&msg.includes("password")) return "البريد الإلكتروني أو كلمة السر غير صحيحة.";
  return "تعذر تسجيل الدخول: "+(error?.message||"خطأ غير معروف");
}
async function login(e){
  if(e)e.preventDefault();
  const email=document.getElementById("loginEmail").value.trim().toLowerCase();
  const password=document.getElementById("loginPassword").value;
  const btn=document.getElementById("loginBtn");
  document.getElementById("loginError").style.display="none";
  if(!email||!password){showLoginError("أدخل البريد الإلكتروني وكلمة السر.");return}
  btn.disabled=true;btn.textContent="جاري التحقق...";
  try{
    const {data,error}=await db.auth.signInWithPassword({email,password});
    if(error){
      console.error("Supabase login error:",error);
      showLoginError(authErrorArabic(error));
      return;
    }
    if(!data?.user){
      showLoginError("تمت محاولة الدخول لكن لم يتم العثور على حساب المستخدم.");
      return;
    }
    if(!(await applyUser(data.user)))return;
    await loadAll();
    toast("تم تسجيل الدخول ✅");
  }catch(error){
    console.error("Login exception:",error);
    showLoginError(authErrorArabic(error));
  }finally{
    btn.disabled=false;
    btn.textContent="دخول إلى التطبيق";
  }
}
async function logout(){if(!confirm("هل تريد تسجيل الخروج؟"))return;await db.auth.signOut();currentUser=null;isAdmin=false;products=[];workers=[];equipment=[];metrology=[];movements=[];showLogin()}
db.auth.onAuthStateChange((event,session)=>{if(event==="SIGNED_OUT"){currentUser=null;isAdmin=false;showLogin()}else if(event==="SIGNED_IN"&&session){setTimeout(async()=>{if(await applyUser(session.user))await loadAll()},0)}});
function showPage(id,btn){if(id==="reports")setTimeout(refreshMovementReport,0);if(id==="admin"&&!isAdmin){toast("هذه الصفحة للأدمن فقط ❌");return;}document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));const p=document.getElementById(id);if(p)p.classList.add("active");document.querySelectorAll(".nav button").forEach(x=>x.classList.remove("active"));if(btn)btn.classList.add("active")}
function activatePage(id){const b=[...document.querySelectorAll(".nav button")].find(x=>x.getAttribute("onclick")?.includes("'"+id+"'"));showPage(id,b)}
function closeModal(id){document.getElementById(id).classList.remove("show")}
async function loadAll(){await Promise.all([loadProducts(),loadWorkers(),loadEquipment(),loadMetrology(),loadMovements()]);statistics();renderDue();renderEquipment();renderMetrology();renderHomeProducts()}
async function loadProducts(){const {data,error}=await db.from("products").select("*").eq("user_id",currentUser.id).order("name");if(error){toast("خطأ في تحميل المنتجات ❌");console.error(error);return}products=data||[];renderProducts()}
let stockFilter="all";
function setStockFilter(filter){stockFilter=filter||"all";renderProducts();}
function activateStockFilter(filter){showPage("stock",[...document.querySelectorAll(".nav button")].find(x=>x.getAttribute("onclick")?.includes("'stock'")));setStockFilter(filter);document.getElementById("stock")?.scrollIntoView({behavior:"smooth",block:"start"});}
function renderProducts(){const box=document.getElementById("products"),q=(document.getElementById("stockSearch")?.value||"").toLowerCase().trim();box.innerHTML="";const list=products.filter(p=>{const qty=Number(p.quantity||0),min=Number(p.min_quantity??p.min_qty??0);const status=qty===0?"empty":(min>0&&qty<=min?"low":"available");const matchesStatus=stockFilter==="all"||stockFilter===status;const textMatch=(p.name||"").toLowerCase().includes(q)||(p.reference||"").toLowerCase().includes(q);return matchesStatus&&textMatch;});list.forEach(p=>{const div=document.createElement("div");div.className="product";const qty=Number(p.quantity||0),min=Number(p.min_quantity??p.min_qty??0);const low=min>0&&qty<=min&&qty>0;div.innerHTML=`<div class="product-main"><div class="product-info"><div class="product-icon">📦</div><div><div class="product-name">${safe(p.name)}</div><div class="product-ref">${safe(p.reference)} · ${safe(p.family||"غير مصنف")}</div></div></div><div class="quantity ${low?"low":"good"}">${qty}<small>الكمية</small></div></div><div class="product-actions"><button class="small-btn edit" onclick="openProduct('${safe(p.id)}')">✏️ تعديل</button><button class="small-btn delete" onclick="deleteProduct('${safe(p.id)}')">🗑️ حذف</button></div>`;box.appendChild(div)});if(!box.children.length){const labels={all:"لا توجد منتجات.",available:"لا توجد مواد متوفرة فوق الحد الأدنى.",low:"لا توجد مواد بلغت الحد الأدنى.",empty:"لا توجد مواد نفد مخزونها."};box.innerHTML=`<div class="info-box" style="text-align:center">${labels[stockFilter]||labels.all}</div>`}}
function renderHomeProducts(){const box=document.getElementById("homeProducts");box.innerHTML="";products.slice(0,5).forEach(p=>{const d=document.createElement("div");d.className="product";d.innerHTML=`<div class="product-main"><div class="product-info"><div class="product-icon">📦</div><div><div class="product-name">${safe(p.name)}</div><div class="product-ref">${safe(p.reference)}</div></div></div><div class="quantity">${Number(p.quantity||0)}<small>الكمية</small></div></div>`;box.appendChild(d)});if(!box.children.length)box.innerHTML='<div class="info-box" style="text-align:center">لا توجد منتجات بعد.</div>'}
function openProduct(id=null){document.getElementById("productId").value=id||"";if(id){const p=products.find(x=>x.id===id);if(!p)return;document.getElementById("productCode").value=p.reference||"";document.getElementById("productName").value=p.name||"";document.getElementById("productCategory").value=p.family||"";document.getElementById("productQty").value=p.quantity||0;document.getElementById("productMinQty").value=p.min_quantity??p.min_qty??0}else{document.getElementById("productCode").value="";document.getElementById("productName").value="";document.getElementById("productCategory").value="";document.getElementById("productQty").value=0;document.getElementById("productMinQty").value=0}document.getElementById("productModal").classList.add("show")}
async function saveProduct(e){e.preventDefault();if(!currentUser)return toast("يجب تسجيل الدخول أولاً ❌");const id=document.getElementById("productId").value;const obj={user_id:currentUser.id,name:document.getElementById("productName").value.trim(),reference:document.getElementById("productCode").value.trim(),family:document.getElementById("productCategory").value.trim(),quantity:Number(document.getElementById("productQty").value)||0,min_quantity:Math.max(0,Number(document.getElementById("productMinQty").value)||0)};if(!obj.name||!obj.reference)return toast("أدخل اسم السلعة والمرجع ❌");const r=id?await db.from("products").update(obj).eq("id",id).eq("user_id",currentUser.id):await db.from("products").insert(obj);if(r.error){console.error(r.error);return toast("تعذر إضافة السلعة: "+errText(r.error));}closeModal("productModal");await loadProducts();statistics();toast(id?"تم تعديل السلعة ✅":"تمت إضافة السلعة ✅")}

async function deleteProduct(id){if(!confirm("هل أنت متأكد من حذف المنتج؟"))return;const {error}=await db.from("products").delete().eq("id",id).eq("user_id",currentUser.id);if(error){toast("تعذر حذف المنتج: "+errText(error));return}await loadProducts();statistics();toast("تم حذف المنتج ✅")}
async function loadMovements(){
  if(!currentUser)return;
  const {data,error}=await db.from("movements").select("*").eq("user_id",currentUser.id).order("created_at",{ascending:false});
  if(error){console.error(error);toast("خطأ في تحديث تقارير الدخول والخروج: "+errText(error));return false}
  movements=data||[];
  renderMovementReport();
  return true;
}
function renderMovements(){ renderMovementReport(); }
function movementDateValue(m){
  if(!m.created_at)return '';
  const d=new Date(m.created_at);
  if(Number.isNaN(d.getTime()))return '';
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
async function refreshMovementReport(){
  if(!currentUser)return toast("يجب تسجيل الدخول أولاً ❌");
  const btns=[...document.querySelectorAll('#reports button')];
  btns.forEach(b=>b.disabled=true);
  try{ await loadMovements(); toast("تم تحديث تقرير الدخول والخروج ✅"); }
  finally{ btns.forEach(b=>b.disabled=false); }
}
function renderMovementReport(){
  const body=document.getElementById("movementsList");
  if(!body)return;
  const from=document.getElementById("reportFrom")?.value||'';
  const to=document.getElementById("reportTo")?.value||'';
  const q=(document.getElementById("movementSearch")?.value||'').toLowerCase().trim();
  const list=movements.filter(m=>{
    const d=movementDateValue(m);
    const text=`${m.product_name||''} ${m.note||''} ${m.type||''}`.toLowerCase();
    return (!from||d>=from)&&(!to||d<=to)&&(!q||text.includes(q));
  });
  let en=0,ex=0;
  list.forEach(m=>{if(m.type==='entry')en+=Number(m.quantity)||0;if(m.type==='exit')ex+=Number(m.quantity)||0});
  const enEl=document.getElementById('reportEntryTotal'),exEl=document.getElementById('reportExitTotal');
  if(enEl)enEl.textContent=en;if(exEl)exEl.textContent=ex;
  body.innerHTML='';
  list.forEach(m=>{
    const tr=document.createElement('tr');
    const isEntry=m.type==='entry';
    const d=m.created_at?new Date(m.created_at):null;
    const dateText=d&&!Number.isNaN(d.getTime())?d.toLocaleString('ar-DZ'):'-';
    tr.innerHTML=`<td>${dateText}</td><td>${safe(m.product_name||'-')}</td><td><span class="status ${isEntry?'status-due':'status-notdue'}">${isEntry?'📥 دخول':'📤 خروج'}</span></td><td><b>${Number(m.quantity)||0}</b></td><td>${safe(m.note||'-')}</td>`;
    body.appendChild(tr);
  });
  if(!body.children.length)body.innerHTML='<tr><td colspan="5" style="text-align:center;padding:25px;color:#6b7280">لا توجد حركات في الفترة المحددة.</td></tr>';
}
/* ===== v2.4 Backup & Restore ===== */
function backupFileName(){
  const d=new Date();
  const pad=n=>String(n).padStart(2,'0');
  return `Stock_Pro_Backup_${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}.json`;
}
function setBackupStatus(text,ok=false){
  const el=document.getElementById('backupStatus');
  if(el){el.textContent=text;el.style.color=ok?'#15803d':'#6b7280';}
}
function downloadBackupObject(payload, filename){
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function buildBackupPayload(){
  return {
    app:'Stock Pro',
    backup_version:'2.4',
    created_at:new Date().toISOString(),
    user_id:currentUser?.id||null,
    data:{
      products:products||[],
      movements:movements||[],
      workers:workers||[],
      equipment:equipment||[],
      metrology:metrology||[]
    }
  };
}
async function exportStockBackup(){
  if(!currentUser)return toast('يجب تسجيل الدخول أولاً ❌');
  try{
    setBackupStatus('🔄 جاري تجهيز النسخة الاحتياطية...');
    /* Refresh all four tables first so the exported file contains the latest server data. */
    await Promise.all([loadProducts(),loadWorkers(),loadEquipment(),loadMetrology(),loadMovements()]);
    const payload=buildBackupPayload();
    downloadBackupObject(payload,backupFileName());
    const total=(payload.data.products.length+payload.data.movements.length+payload.data.workers.length+payload.data.equipment.length+payload.data.metrology.length);
    setBackupStatus(`✅ تم تصدير النسخة بنجاح — ${total} سجل`,true);
    toast('تم إنشاء النسخة الاحتياطية ✅');
  }catch(e){console.error(e);setBackupStatus('❌ تعذر إنشاء النسخة الاحتياطية');toast('تعذر إنشاء النسخة الاحتياطية ❌');}
}
function validateBackupPayload(payload){
  if(!payload||typeof payload!=='object')throw new Error('ملف غير صالح');
  if(payload.app!=='Stock Pro')throw new Error('هذا الملف ليس نسخة من Stock Pro');
  if(!payload.data||typeof payload.data!=='object')throw new Error('بيانات النسخة غير موجودة');
  for(const k of ['products','movements','workers','equipment','metrology']){
    if(!Array.isArray(payload.data[k]))throw new Error(`بيانات ${k} غير صالحة`);
  }
  return payload;
}
async function restoreStockBackup(event){
  const input=event.target;
  const file=input?.files?.[0];
  if(!file)return;
  try{
    if(!currentUser)throw new Error('يجب تسجيل الدخول أولاً');
    setBackupStatus('🔄 قراءة ملف النسخة...');
    const text=await file.text();
    const payload=validateBackupPayload(JSON.parse(text));
    const d=payload.data;
    d.metrology=Array.isArray(d.metrology)?d.metrology:[];
    const count=d.products.length+d.movements.length+d.workers.length+d.equipment.length+d.metrology.length;
    const sameUser=payload.user_id&&payload.user_id===currentUser.id;
    const msg=`سيتم استرجاع ${count} سجل إلى حسابك.\n\nالبيانات الحالية للمنتجات والحركات والعمال والتجهيزات سيتم استبدالها.\n\n${sameUser?'النسخة تخص نفس الحساب.':'النسخة من حساب/جهاز آخر؛ سيتم ربط البيانات بحسابك الحالي.'}\n\nقبل الاسترجاع سيتم تنزيل نسخة أمان من البيانات الحالية تلقائياً.\n\nهل تريد المتابعة؟`;
    if(!confirm('⚠️ تأكيد الاسترجاع\n\n'+msg)){input.value='';setBackupStatus('تم إلغاء الاسترجاع.');return;}
    /* Safety copy of current data before any destructive operation. */
    await Promise.all([loadProducts(),loadWorkers(),loadEquipment(),loadMetrology(),loadMovements()]);
    downloadBackupObject(buildBackupPayload(),`Stock_Pro_PreRestore_${new Date().toISOString().slice(0,10)}.json`);
    setBackupStatus('🔄 جاري استبدال البيانات...');
    const uid=currentUser.id;
    /* Delete dependent rows first to avoid foreign-key conflicts. */
    for(const table of ['metrology','equipment','movements','workers','products']){
      const {error}=await db.from(table).delete().eq('user_id',uid);
      if(error)throw new Error(`تعذر تنظيف ${table}: ${errText(error)}`);
    }
    const clean=(row)=>{const x={...row};delete x.created_at;delete x.updated_at;x.user_id=uid;if('created_by' in x)x.created_by=uid;return x;};
    const insertBatch=async(table,rows)=>{
      if(!rows.length)return;
      const cleanRows=rows.map(clean);
      const {error}=await db.from(table).insert(cleanRows);
      if(error)throw new Error(`تعذر استرجاع ${table}: ${errText(error)}`);
    };
    await insertBatch('products',d.products);
    await insertBatch('workers',d.workers);
    await insertBatch('equipment',d.equipment);
    await insertBatch('metrology',d.metrology);
    await insertBatch('movements',d.movements);
    await Promise.all([loadProducts(),loadWorkers(),loadEquipment(),loadMetrology(),loadMovements()]);
    statistics();renderDue();renderEquipment();renderMetrology();renderHomeProducts();renderV22Alerts();
    setBackupStatus(`✅ تم الاسترجاع بنجاح — ${count} سجل`,true);
    toast('تم استرجاع النسخة الاحتياطية بنجاح ✅');
  }catch(e){
    console.error(e);
    setBackupStatus('❌ فشل الاسترجاع: '+(e.message||e));
    toast('فشل استرجاع النسخة: '+(e.message||'خطأ غير معروف')+' ❌');
  }finally{if(input)input.value='';}
}

function clearReportFilters(){
  const a=document.getElementById('reportFrom'),b=document.getElementById('reportTo'),q=document.getElementById('movementSearch');
  if(a)a.value='';if(b)b.value='';if(q)q.value='';renderMovementReport();
}
async function clearOldReports(){
  if(!currentUser)return toast("يجب تسجيل الدخول أولاً ❌");
  if(!movements.length)return toast("لا توجد تقارير قديمة لمسحها.");
  const ok=confirm("⚠️ تحذير\n\nسيتم حذف جميع سجلات الدخول والخروج الخاصة بحسابك نهائياً.\n\nهذا لا يغيّر كميات المخزون الحالية.\n\nهل تريد المتابعة؟");
  if(!ok)return;
  const btns=[...document.querySelectorAll('#reports button')];btns.forEach(b=>b.disabled=true);
  try{
    const {error}=await db.from("movements").delete().eq("user_id",currentUser.id);
    if(error){console.error(error);toast("تعذر مسح التقارير: "+errText(error));return}
    movements=[];renderMovementReport();toast("تم مسح جميع التقارير القديمة بنجاح ✅");
  }finally{btns.forEach(b=>b.disabled=false);}
}

function openMovement(type){movementType=type;document.getElementById("movementTitle").textContent=type==="entry"?"📥 دخول المخزون":"📤 خروج المخزون";const s=document.getElementById("movementProduct");s.innerHTML="";products.forEach(p=>{const o=document.createElement("option");o.value=p.id;o.textContent=`${p.name} (${p.quantity})`;s.appendChild(o)});if(!products.length){toast("أضف منتجًا أولاً ❌");return}document.getElementById("movementQty").value=1;document.getElementById("movementNote").value="";document.getElementById("movementModal").classList.add("show")}
async function saveMovement(e){e.preventDefault();const pid=document.getElementById("movementProduct").value,qty=Number(document.getElementById("movementQty").value),note=document.getElementById("movementNote").value.trim(),p=products.find(x=>x.id===pid);if(!p||qty<=0)return;const newQty=movementType==="entry"?Number(p.quantity||0)+qty:Number(p.quantity||0)-qty;if(newQty<0){toast("الكمية غير كافية للخروج ❌");return}const a=await db.from("movements").insert({user_id:currentUser.id,product_id:pid,product_name:p.name,type:movementType,quantity:qty,note});if(a.error){toast("تعذر تسجيل الحركة: "+errText(a.error));return}const b=await db.from("products").update({quantity:newQty}).eq("id",pid).eq("user_id",currentUser.id);if(b.error){toast("تم تسجيل الحركة لكن تعذر تحديث الكمية: "+errText(b.error));return}closeModal("movementModal");await loadProducts();await loadMovements();statistics();toast("تم تسجيل الحركة ✅")}
async function loadWorkers(){
  if(!currentUser){
    workers=[];
    renderWorkers();
    renderEquipment();
    renderDue();
    return;
  }

  const {data,error}=await db
    .from("workers")
    .select("*")
    .eq("user_id",currentUser.id)
    .order("name",{ascending:true});

  if(error){
    console.error("❌ خطأ تحميل العمال:",error);
    toast("خطأ في تحميل العمال ❌");
    return;
  }

  workers=data||[];
  renderWorkers();
  renderEquipment();
  renderDue();
  console.log("✅ تم تحميل العمال:",workers.length);
}
function renderWorkers(){
  const box=document.getElementById("workersList");
  if(!box)return;
  const q=(document.getElementById("workerSearch")?.value||"").toLowerCase().trim();
  box.innerHTML="";
  const list=workers.filter(w=>{
    const name=String(w.name||"").toLowerCase();
    const matricule=String(w.matricule||"").toLowerCase();
    const job=String(w.job||"").toLowerCase();
    return !q||name.includes(q)||matricule.includes(q)||job.includes(q);
  });
  list.forEach(w=>{
    const d=document.createElement("div");
    d.className="worker";
    d.innerHTML=`<div class="worker-main"><div class="worker-info"><div class="worker-icon">👷</div><div><div class="worker-name">${safe(w.name)}</div><div class="worker-matricule">${safe(w.matricule)}</div><div style="font-size:11px;color:#6b7280;margin-top:4px">${safe(w.job||"")}</div></div></div><span class="worker-status ${w.status==="inactive"?"inactive":""}">${w.status==="inactive"?"غير نشط":"نشط"}</span></div><div class="product-actions"><button class="small-btn delete" type="button" onclick="deleteWorker('${safe(w.id)}')">🗑️ حذف</button></div>`;
    box.appendChild(d);
  });
  if(!box.children.length)box.innerHTML=`<div class="info-box" style="text-align:center">${q?"لا يوجد عمال مطابقون للبحث.":"لا يوجد عمال."}</div>`;
}
function openWorker(){document.getElementById("workerMatricule").value="";document.getElementById("workerName").value="";document.getElementById("workerRole").value="";document.getElementById("workerModal").classList.add("show")}
async function saveWorker(e){
  e.preventDefault();
  if(!currentUser)return toast("يجب تسجيل الدخول أولاً ❌");
  const matricule=document.getElementById("workerMatricule").value.trim();
  const name=document.getElementById("workerName").value.trim();
  const job=document.getElementById("workerRole").value.trim();
  if(!matricule||!name)return toast("أدخل Matricule واسم العامل ❌");
  const exists=workers.some(w=>String(w.matricule||"").trim().toLowerCase()===matricule.toLowerCase());
  if(exists)return toast("هذا الـ Matricule موجود بالفعل ❌");
  const obj={user_id:currentUser.id,matricule,name,job,status:"active"};
  const {error}=await db.from("workers").insert(obj);
  if(error){console.error("❌ إضافة العامل:",error);return toast("تعذر إضافة العامل: "+errText(error));}
  closeModal("workerModal");
  await loadWorkers();
  await loadEquipment();
  renderWorkers();
  renderEquipment();
  renderDue();
  toast("تمت إضافة العامل وظهر في التجهيزات مباشرة ✅");
}

async function deleteWorker(id){const w=workers.find(x=>String(x.id)===String(id));if(!w||!confirm("هل أنت متأكد من حذف العامل؟\n\n"+w.name))return;const eq=await db.from("equipment").delete().eq("worker_id",id).eq("user_id",currentUser.id);if(eq.error){console.error(eq.error);return toast("تعذر حذف تجهيزات العامل: "+errText(eq.error));}const {error}=await db.from("workers").delete().eq("id",id).eq("user_id",currentUser.id);if(error){toast("تعذر حذف العامل: "+errText(error));return}await loadWorkers();await loadEquipment();renderDue();statistics();toast("تم حذف العامل وتجهيزاته السابقة ✅")}
async function loadEquipment(){const {data,error}=await db.from("equipment").select("*").eq("user_id",currentUser.id);if(error){toast("خطأ في تحميل التجهيزات ❌");console.error(error);return}equipment=data||[];renderEquipment();renderDue()}
function interval(t){return t==="shoes"?{m:12,d:0}:t==="bleu"?{m:6,d:0}:t==="glasses"?{m:6,d:0}:t==="gants"?{m:0,d:35}:{m:6,d:0}}
function nextDue(date,type){const x=interval(type);return x.m?addMonths(date,x.m):addDays(date,x.d)}
function dueDiffDays(date){if(!date)return null;return Math.ceil((new Date(date+"T00:00:00")-new Date(todayKey()+"T00:00:00"))/86400000)}
function dueStatus(date){if(!date)return"none";const diff=dueDiffDays(date);return diff<=0?"due":diff<30?"soon":"notdue"}
function remainingText(date){
  if(!date)return "لم يُسلّم";
  const diff=dueDiffDays(date);
  if(diff<=0)return diff===0?"مستحق اليوم":"مستحق منذ "+Math.abs(diff)+" يوم";
  const a=new Date(todayKey()+"T00:00:00"), b=new Date(date+"T00:00:00");
  let months=(b.getFullYear()-a.getFullYear())*12+(b.getMonth()-a.getMonth());
  const anchor=new Date(a); anchor.setMonth(anchor.getMonth()+months);
  if(anchor>b){months--;anchor.setMonth(anchor.getMonth()-1)}
  const days=Math.round((b-anchor)/86400000);
  let parts=[];
  if(months===1)parts.push("شهر واحد");
  else if(months===2)parts.push("شهران");
  else if(months>2)parts.push(months+" أشهر");
  if(days===1)parts.push("يوم واحد");
  else if(days===2)parts.push("يومان");
  else if(days>2)parts.push(days+" أيام");
  return "باقي "+(parts.join(" و ")||diff+" يوم");
}
function equipmentLabel(t){return {shoes:"حذاء حماية",bleu:"ملابس العمل",glasses:"نظارات حماية",gants:"قفازات",vest_soudeur:"سترة لحام"}[t]||t}
function statusText(s){return s==="due"?"مستحق":s==="soon"?"قريب من الاستحقاق":s==="notdue"?"غير مستحق":"لم يُسلّم"}
function updateEquipmentDueDate(force=true){const last=document.getElementById("equipmentDate").value;const type=document.getElementById("equipmentType").value;const due=document.getElementById("equipmentDueDate");if(last&&type&&due&&(force||!due.value))due.value=nextDue(last,type)}
async function openEquipment(){
  await loadWorkers();
  const s=document.getElementById("equipmentWorker");
  s.innerHTML='<option value="">اختر العامل...</option>';
  workers.filter(w=>w.status!=="inactive").forEach(w=>{
    const o=document.createElement("option");
    o.value=w.matricule;
    o.textContent=`${w.name} (${w.matricule})`;
    s.appendChild(o);
  });
  document.getElementById("equipmentDate").value=todayKey();
  document.getElementById("equipmentDueDate").value=nextDue(todayKey(),document.getElementById("equipmentType").value);
  document.getElementById("equipmentQty").value=1;
  document.getElementById("equipmentBon").value="";
  document.getElementById("equipmentNote").value="";
  s.onchange=loadExistingEquipmentForEdit;
  document.getElementById("equipmentType").onchange=loadExistingEquipmentForEdit;
  document.getElementById("equipmentDate").onchange=function(){updateEquipmentDueDate(true)};
  document.getElementById("equipmentModal").classList.add("show");
}
 function loadExistingEquipmentForEdit(){const matricule=document.getElementById("equipmentWorker").value;const type=document.getElementById("equipmentType").value;const w=workers.find(x=>String(x.matricule)===String(matricule));const e=w?equipment.find(x=>String(x.worker_id)===String(w.id)&&String(x.type)===String(type)):null;if(e){document.getElementById("equipmentDate").value=e.last_date||todayKey();document.getElementById("equipmentDueDate").value=e.due_date||nextDue(document.getElementById("equipmentDate").value,type);document.getElementById("equipmentQty").value=e.quantity||1;document.getElementById("equipmentBon").value=e.bon||"";document.getElementById("equipmentNote").value=e.note||"";}else{const d=todayKey();document.getElementById("equipmentDate").value=d;document.getElementById("equipmentDueDate").value=nextDue(d,type);document.getElementById("equipmentQty").value=1;document.getElementById("equipmentBon").value="";document.getElementById("equipmentNote").value="";}}
async function saveEquipment(){const matricule=document.getElementById("equipmentWorker").value;const type=document.getElementById("equipmentType").value;const last=document.getElementById("equipmentDate").value;const selectedDue=document.getElementById("equipmentDueDate").value;const qty=Math.max(1,Number(document.getElementById("equipmentQty").value)||1);if(!matricule||!last||!selectedDue)return toast("اختر العامل وتاريخ التسليم والاستحقاق القادم ❌");if(new Date(selectedDue+"T00:00:00")<new Date(last+"T00:00:00"))return toast("تاريخ الاستحقاق القادم لا يمكن أن يكون قبل تاريخ التسليم ❌");const w=workers.find(x=>String(x.matricule)===String(matricule));if(!w)return toast("العامل غير موجود ❌");const names={shoes:"حذاء حماية",bleu:"بدلة عمل",glasses:"نظارات حماية",gants:"قفازات",vest_soudeur:"سترة لحام"};const obj={user_id:currentUser.id,created_by:currentUser.id,worker_id:w.id,matricule:w.matricule,worker_name:w.name||"",type,equipment_name:names[type]||type,quantity:qty,last_date:last,due_date:selectedDue,bon:document.getElementById("equipmentBon").value.trim(),note:document.getElementById("equipmentNote").value.trim()};const existing=equipment.find(x=>String(x.worker_id)===String(w.id)&&String(x.type)===String(type));const r=existing?await db.from("equipment").update(obj).eq("id",existing.id).eq("user_id",currentUser.id):await db.from("equipment").insert(obj);if(r.error){console.error(r.error);return toast("تعذر تسجيل التجهيز: "+errText(r.error));}closeModal("equipmentModal");await loadEquipment();renderDue();statistics();toast("تم تسجيل التجهيز ✅")}

function daysRemaining(date){if(!date)return null;return Math.ceil((new Date(date+"T00:00:00")-new Date(todayKey()+"T00:00:00"))/86400000)}
async function loadMetrology(){
  if(!currentUser)return;
  const {data,error}=await db.from("metrology").select("*").eq("user_id",currentUser.id).order("expiry_date",{ascending:true});
  if(error){console.error(error);toast("تعذر تحميل معدات الميترولوجي: "+errText(error));return}
  metrology=data||[];renderMetrology();
}
function metrologyDuration(item){const n=Number(item?.calibration_duration_months||12);return Number.isFinite(n)&&n>0?n:12}
function metrologyStatus(date){if(!date)return"none";const d=dueDiffDays(date);return d<=0?"due":d<=30?"soon":"notdue"}
function metrologyRemaining(date){if(!date)return"غير محدد";return remainingText(date)}
function metrologyDurationLabel(months){months=Number(months)||12;return months===1?"شهر واحد":months===2?"شهران":months===12?"سنة واحدة":months%12===0?(months/12)+" سنوات":months+" أشهر"}
function updateMetrologyExpiry(){
  const start=document.getElementById("metrologyCalibrationDate")?.value;
  const sel=document.getElementById("metrologyDuration")?.value;
  const custom=document.getElementById("metrologyCustomDurationBox");
  if(custom)custom.style.display=sel==="custom"?"block":"none";
  if(!start)return;
  const months=sel==="custom"?Math.max(1,Number(document.getElementById("metrologyCustomDuration")?.value)||12):Number(sel)||12;
  const exp=document.getElementById("metrologyExpiry");if(exp)exp.value=addMonths(start,months);
}
function openMetrology(id=null){
  document.getElementById("metrologyId").value=id||"";
  const today=todayKey();
  if(id){
    const x=metrology.find(m=>String(m.id)===String(id));if(!x)return;
    document.getElementById("metrologyTitle").textContent="تعديل جهاز ميترولوجي";
    document.getElementById("metrologyName").value=x.name||"";
    document.getElementById("metrologyReference").value=x.reference||"";
    document.getElementById("metrologySerial").value=x.serial_number||"";
    document.getElementById("metrologyCalibrationDate").value=x.calibration_date||"";
    const months=Number(x.calibration_duration_months)||12;
    const allowed=[1,6,12,24];
    if(allowed.includes(months)){document.getElementById("metrologyDuration").value=String(months)}else{document.getElementById("metrologyDuration").value="custom";document.getElementById("metrologyCustomDuration").value=months}
    document.getElementById("metrologyNote").value=x.note||"";
    updateMetrologyExpiry();
    if(x.expiry_date)document.getElementById("metrologyExpiry").value=x.expiry_date;
  }else{
    document.getElementById("metrologyTitle").textContent="إضافة جهاز ميترولوجي";
    document.getElementById("metrologyName").value="";document.getElementById("metrologyReference").value="";document.getElementById("metrologySerial").value="";
    document.getElementById("metrologyCalibrationDate").value=today;document.getElementById("metrologyDuration").value="12";document.getElementById("metrologyCustomDuration").value="12";document.getElementById("metrologyNote").value="";updateMetrologyExpiry();
  }
  document.getElementById("metrologyModal").classList.add("show");
}
async function saveMetrology(e){
  e.preventDefault();if(!currentUser)return toast("يجب تسجيل الدخول أولاً ❌");
  const id=document.getElementById("metrologyId").value;
  const name=document.getElementById("metrologyName").value.trim();
  const calibration_date=document.getElementById("metrologyCalibrationDate").value;
  const sel=document.getElementById("metrologyDuration").value;
  const calibration_duration_months=sel==="custom"?Math.max(1,Number(document.getElementById("metrologyCustomDuration").value)||12):Number(sel)||12;
  const expiry_date=addMonths(calibration_date,calibration_duration_months);
  const obj={user_id:currentUser.id,name,reference:document.getElementById("metrologyReference").value.trim(),serial_number:document.getElementById("metrologySerial").value.trim(),calibration_date,calibration_duration_months,expiry_date,note:document.getElementById("metrologyNote").value.trim()};
  if(!name||!calibration_date)return toast("أدخل نوع الجهاز وتاريخ الطالوناج ❌");
  const r=id?await db.from("metrology").update(obj).eq("id",id).eq("user_id",currentUser.id):await db.from("metrology").insert(obj);
  if(r.error){console.error(r.error);return toast("تعذر حفظ الجهاز: "+errText(r.error));}
  closeModal("metrologyModal");await loadMetrology();toast(id?"تم تعديل الجهاز ✅":"تمت إضافة الجهاز ✅");
}
async function deleteMetrology(id){const x=metrology.find(m=>String(m.id)===String(id));if(!x||!confirm("حذف الجهاز؟\n\n"+(x.name||"")))return;const {error}=await db.from("metrology").delete().eq("id",id).eq("user_id",currentUser.id);if(error)return toast("تعذر حذف الجهاز: "+errText(error));await loadMetrology();toast("تم حذف الجهاز ✅")}
function renderMetrology(){
  const box=document.getElementById("metrologyList");if(!box)return;const q=(document.getElementById("metrologySearch")?.value||"").toLowerCase().trim();box.innerHTML="";
  let valid=0,soon=0,expired=0;
  const list=metrology.filter(x=>`${x.name||""} ${x.reference||""} ${x.serial_number||""}`.toLowerCase().includes(q));
  list.forEach(x=>{const st=metrologyStatus(x.expiry_date);if(st==="notdue")valid++;else if(st==="soon")soon++;else if(st==="due")expired++;const d=document.createElement("div");d.className="equipment";d.innerHTML=`<div class="equipment-top"><div class="equipment-info"><div class="equipment-icon">📏</div><div><div class="equipment-name">${safe(x.name)}</div><div class="worker-matricule">${safe(x.reference||"بدون Référence")} ${x.serial_number?" · S/N "+safe(x.serial_number):""}</div></div><span class="status status-${st}">${st==="due"?"منتهي":st==="soon"?"قريب الانتهاء":"صالح"}</span></div><div style="margin-top:10px"><div class="equipment-duration">📅 تاريخ الطالوناج: <b>${formatDate(x.calibration_date)}</b></div><div class="equipment-duration">⏱️ مدة الطالوناج: <b>${metrologyDurationLabel(x.calibration_duration_months)}</b></div><div class="equipment-duration">📅 نهاية الطالوناج: <b>${formatDate(x.expiry_date)}</b></div><div style="font-weight:bold;margin-top:5px" class="equip-state-${st}">${metrologyRemaining(x.expiry_date)}</div>${x.note?`<div class="equipment-duration">📝 ${safe(x.note)}</div>`:""}</div><div class="product-actions" style="margin-top:10px"><button class="small-btn edit" onclick="openMetrology('${safe(x.id)}')">✏️ تعديل</button><button class="small-btn delete" onclick="deleteMetrology('${safe(x.id)}')">🗑️ حذف</button></div>`;box.appendChild(d)});
  const stats=document.getElementById("metrologyStats");if(stats)stats.innerHTML=`<div class="stat"><div class="icon green">🟢</div><div><span>صالح</span><strong>${valid}</strong></div></div><div class="stat"><div class="icon orange">🟡</div><div><span>قريب الانتهاء</span><strong>${soon}</strong></div></div><div class="stat"><div class="icon red">🔴</div><div><span>منتهي</span><strong>${expired}</strong></div></div>`;
  if(!box.children.length)box.innerHTML='<div class="info-box" style="text-align:center">لا توجد معدات ميترولوجي مسجلة.</div>';
}
function renderEquipment(){const box=document.getElementById("equipmentList"),q=(document.getElementById("equipmentSearch")?.value||"").toLowerCase().trim();box.innerHTML="";workers.filter(w=>(w.name||"").toLowerCase().includes(q)||(w.matricule||"").toLowerCase().includes(q)).forEach(w=>{let rows="";["shoes","bleu","glasses","gants","vest_soudeur"].forEach(t=>{const e=equipment.find(x=>String(x.worker_id)===String(w.id)&&x.type===t),s=e?dueStatus(e.due_date):"none",txt=e?remainingText(e.due_date):"لم يُسلّم";rows+=`<div style="display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid #eee"><div><b>${equipmentLabel(t)}</b><div class="equipment-duration">آخر تسليم: ${formatDate(e?.last_date)}</div><div class="equipment-duration">تاريخ الاستحقاق: ${formatDate(e?.due_date)}</div><div style="font-weight:bold;margin-top:3px" class="equip-state-${s}">${txt}</div></div><span class="status status-${s}">${statusText(s)}</span></div>`});const d=document.createElement("div");d.className="equipment";d.innerHTML=`<div class="equipment-top"><div class="equipment-info"><div class="equipment-icon">👕</div><div><div class="equipment-name">${safe(w.name)}</div><div class="worker-matricule">${safe(w.matricule)}</div></div></div></div><div style="margin-top:10px">${rows}</div>`;box.appendChild(d)});if(!box.children.length)box.innerHTML='<div class="info-box" style="text-align:center">لا توجد بيانات تجهيزات.</div>'}
function renderDue(){const box=document.getElementById("dueList"),q=(document.getElementById("dueSearch")?.value||"").toLowerCase().trim();box.innerHTML="";let count=0;workers.filter(w=>w.status!=="inactive").forEach(w=>{if(q&&!(`${w.name||""} ${w.matricule||""}`).toLowerCase().includes(q))return;let rows="";["shoes","bleu","glasses","gants","vest_soudeur"].forEach(t=>{const e=equipment.find(x=>String(x.worker_id)===String(w.id)&&x.type===t),s=e?dueStatus(e.due_date):"none";if(s==="due")count++;if(s!=="due"||s==="due"){const txt=e?remainingText(e.due_date):"لم يُسلّم";rows+=`<div style="padding:9px 0;border-bottom:1px solid #eee"><b>${equipmentLabel(t)}</b><div class="equipment-duration">آخر تسليم: ${formatDate(e?.last_date)}</div><div class="equipment-duration">تاريخ الاستحقاق: ${formatDate(e?.due_date)}</div><div style="font-weight:bold" class="equip-state-${s}">${txt}</div><span class="status status-${s}" style="display:inline-block;margin-top:5px">${statusText(s)}</span></div>`}});if(rows){const d=document.createElement("div");d.className="equipment";d.innerHTML=`<div class="worker-name">${safe(w.name)} <small>(${safe(w.matricule)})</small></div><div style="margin-top:8px">${rows}</div>`;box.appendChild(d)}});document.getElementById("dueToday").textContent=count;if(!box.children.length)box.innerHTML='<div class="info-box" style="text-align:center">لا توجد استحقاقات حالياً.</div>'}
function statistics(){document.getElementById("productsNumber").textContent=products.length;let en=0,ex=0,t=todayKey();movements.forEach(m=>{if((m.created_at||"").slice(0,10)===t){if(m.type==="entry")en+=Number(m.quantity)||0;if(m.type==="exit")ex+=Number(m.quantity)||0}});document.getElementById("entryToday").textContent=en;document.getElementById("exitToday").textContent=ex;renderDue()}
async function loadUsers(){
  if(!isMasterAdmin())return;
  const {data,error}=await db.from("profiles").select("id,full_name,role,created_at,is_blocked").order("full_name");
  if(error){console.error(error);toast("تعذر تحميل المستخدمين: "+errText(error));return}
  users=data||[];renderUsers();
}
function renderUsers(){
  const body=document.getElementById("usersList"),q=(document.getElementById("userSearch")?.value||"").toLowerCase().trim();
  if(!body)return; body.innerHTML="";
  users.filter(u=>`${u.full_name||""} ${u.id||""} ${u.role||""}`.toLowerCase().includes(q)).forEach(u=>{
    const admin=u.role==="admin",self=u.id===currentUser.id,blocked=!!u.is_blocked;
    const tr=document.createElement("tr");
    const roleText=admin?'<span class="admin-badge">ADMIN</span>':'<span>WORKER</span>';
    const state=blocked?'<span class="status status-notdue">موقوف</span>':'<span class="status status-due">نشط</span>';
    let actions='';
    if(self){actions='<span style="color:#6b7280;font-size:11px">حسابك — محمي</span>'}
    else{
      actions=`<div class="v22-user-actions">
        ${admin?`<button class="small-btn warning" onclick="setUserRole('${u.id}','worker')">👤 نزع الأدمن</button>`:`<button class="small-btn success" onclick="setUserRole('${u.id}','admin')">👑 تعيين أدمن</button>`}
        ${blocked?`<button class="small-btn success" onclick="setUserBlocked('${u.id}',false)">✅ تفعيل</button>`:`<button class="small-btn delete" onclick="setUserBlocked('${u.id}',true)">⛔ حظر</button>`}
        ${blocked?`<button class="small-btn warning" onclick="setUserTemporary('${u.id}')">⏱️ توقيف مؤقت</button>`:''}
      </div>`;
    }
    tr.className=blocked?'blocked':'';
    tr.innerHTML=`<td style="direction:ltr;text-align:left;font-size:10px">${safe(u.id||"-")}</td><td>${safe(u.full_name||"بدون اسم")}</td><td>${roleText}</td><td>${state}</td><td>${actions}</td>`;
    body.appendChild(tr);
  });
  if(!body.children.length)body.innerHTML='<tr><td colspan="5" style="text-align:center;padding:25px;color:#6b7280">لا توجد حسابات.</td></tr>';
}
const MASTER_ADMIN_ID="";
function isProtectedUser(id){return !id||id===currentUser?.id||String(currentUser?.email||"").toLowerCase()===MASTER_ADMIN_EMAIL.toLowerCase()&&id===currentUser.id}
async function adminProfileUpdate(id,values,successMessage){
  if(!isMasterAdmin()||isProtectedUser(id))return toast("لا يمكن تعديل حساب الأدمن الرئيسي ❌");
  const {error}=await db.from("profiles").update(values).eq("id",id);
  if(error){console.error(error);toast("تعذر تنفيذ العملية: "+errText(error));return}
  await loadUsers();toast(successMessage);
}
async function setUserRole(id,role){
  if(!isMasterAdmin()||isProtectedUser(id))return;
  if(!confirm(role==="admin"?"تعيين هذا المستخدم كأدمن؟":"نزع صلاحية الأدمن من هذا المستخدم؟"))return;
  await adminProfileUpdate(id,{role},role==="admin"?"تم تعيينه أدمن ✅":"تم نزع صلاحية الأدمن ✅");
}
async function setUserBlocked(id,blocked){
  if(!isMasterAdmin()||isProtectedUser(id))return;
  if(!confirm(blocked?"حظر هذا الحساب؟ يمكن إعادة تفعيله لاحقًا.":"إعادة تفعيل هذا الحساب؟"))return;
  await adminProfileUpdate(id,{is_blocked:blocked},blocked?"تم حظر الحساب ⛔":"تم تفعيل الحساب ✅");
}
async function setUserTemporary(id){
  if(!isMasterAdmin()||isProtectedUser(id))return;
  const raw=prompt("مدة التوقيف المؤقت بالدقائق (مثال: 60):","60");
  const mins=Number(raw); if(!Number.isFinite(mins)||mins<=0)return;
  const until=new Date(Date.now()+mins*60000).toISOString();
  // v2.2 uses blocked_until when the column exists. If it does not exist yet, keep the account blocked safely.
  const r=await db.from("profiles").update({is_blocked:true,blocked_until:until}).eq("id",id);
  if(r.error){
    const fallback=await db.from("profiles").update({is_blocked:true}).eq("id",id);
    if(fallback.error){toast("تعذر توقيف الحساب: "+errText(fallback.error));return}
    await loadUsers();toast("تم توقيف الحساب. لإلغاء التوقيف اضغط تفعيل. ⚠️");return;
  }
  await loadUsers();toast(`تم توقيف الحساب لمدة ${mins} دقيقة ⏱️`);
}
["stockSearch","workerSearch","equipmentSearch","dueSearch","userSearch","movementSearch","metrologySearch"].forEach(id=>document.getElementById(id)?.addEventListener("input",()=>{if(id==="stockSearch")renderProducts();else if(id==="workerSearch")renderWorkers();else if(id==="equipmentSearch")renderEquipment();else if(id==="dueSearch")renderDue();else if(id==="movementSearch")renderMovementReport();else if(id==="metrologySearch")renderMetrology();else renderUsers()}));
document.querySelectorAll(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.classList.remove("show")}));
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;updateInstallButton()});window.addEventListener("appinstalled",()=>{deferredPrompt=null;updateInstallButton();toast("تم تثبيت Stock Pro على الهاتف ✅")});async function installApp(){
  if(isAppInstalled()){
    updateInstallButton();
    return;
  }

  if(!deferredPrompt){
    updateInstallButton();
    toast("من قائمة المتصفح اختر «إضافة إلى الشاشة الرئيسية» لتثبيت التطبيق 📲");
    return;
  }

  try{
    await deferredPrompt.prompt();
    const r=await deferredPrompt.userChoice;
    deferredPrompt=null;
    updateInstallButton();
    if(r?.outcome==="accepted") toast("تم بدء تثبيت التطبيق ✅");
  }catch(e){
    console.warn(e);
    deferredPrompt=null;
    updateInstallButton();
  }
}
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(e=>console.warn("SW:",e)));
changeLanguage(currentLanguage);
updateInstallButton();
window.addEventListener("pageshow",updateInstallButton);

/* ===== v2.1 dashboard/theme ===== */
function setTheme(theme){
  const isDark=theme==='dark';
  document.body.classList.toggle('theme-dark',isDark);
  localStorage.setItem('stockpro_theme',isDark?'dark':'light');
  const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute('content',isDark?'#111827':'#f3f4f6');
}
function loadTheme(){setTheme(localStorage.getItem('stockpro_theme')||'light');}
function smartAlertCounts(){
  let due=0,soon=0,low=0,overdue=0,empty=0;
  equipment.forEach(e=>{const s=dueStatus(e.due_date);if(s==='due')due++;else if(s==='soon')soon++;else if(s==='overdue')overdue++;});
  products.forEach(p=>{const qty=Number(p.quantity||0);const min=Number(p.min_quantity??p.min_qty??0);if(qty===0)empty++;else if(min>0&&qty<=min)low++;});
  const good=products.filter(p=>Number(p.quantity||0)>Number(p.min_quantity??p.min_qty??0)).length;
  return {good,due,soon,low,overdue,empty,total:due+soon+low+overdue+empty};
}
function renderV22Alerts(){
  const box=document.getElementById('v22Alerts');if(!box)return;
  const a=smartAlertCounts();
  const lang=currentLanguage;
  const t=(ar,fr,en)=>lang==='fr'?fr:lang==='en'?en:ar;
  box.innerHTML=`
    <div class="v22-alert ${a.due||a.overdue?'danger':''} ${a.due||a.overdue?'has-alert':''}" onclick="activatePage('due')"><span class="alert-dot"></span>🔴 <small>${t('استحقاقات عاجلة','Échéances urgentes','Urgent due')}</small><strong>${a.due+a.overdue}</strong></div>
    <div class="v22-alert ${a.soon?'warning':''} ${a.soon?'has-alert':''}" onclick="activatePage('equipment')"><span class="alert-dot"></span>🟡 <small>${t('قريبة من الاستحقاق','Bientôt à échéance','Due soon')}</small><strong>${a.soon}</strong></div>
    <div class="v22-alert success ${a.good?'has-alert':''}" onclick="activateStockFilter('available')"><span class="alert-dot"></span>🟢 <small>${t('المخزون متوفر','Stock disponible','Stock available')}</small><strong>${a.good||0}</strong></div>
    <div class="v22-alert ${a.low?'info':''} ${a.low?'has-alert':''}" onclick="activateStockFilter('low')"><span class="alert-dot"></span>🔴 <small>${t('بلغ الحد الأدنى','Seuil minimum atteint','Minimum reached')}</small><strong>${a.low}</strong></div><div class="v22-alert danger ${a.empty?'has-alert':''}" onclick="activateStockFilter('empty')"><span class="alert-dot"></span>🚫 <small>${t('نفاذ المخزون','Rupture de stock','Out of stock')}</small><strong>${a.empty}</strong></div>`;
}
async function enableSmartNotifications(){
  if(!('Notification' in window)){toast('المتصفح لا يدعم التنبيهات ❌');return}
  try{const p=await Notification.requestPermission();updateNotificationStatus();if(p==='granted'){notifySmartAlerts(true);toast('تم تفعيل التنبيهات الذكية 🔔')}}catch(e){console.warn(e);toast('تعذر تفعيل التنبيهات ❌')}
}
function updateNotificationStatus(){const e=document.getElementById('notificationStatus');if(!e)return;const p=('Notification' in window)?Notification.permission:'unsupported';e.textContent=p==='granted'?'حالة التنبيهات: مفعلة 🔔':p==='denied'?'حالة التنبيهات: محظورة من المتصفح ⛔':'حالة التنبيهات: غير مفعلة';}
function notifySmartAlerts(force=false){
  if(!('Notification' in window)||Notification.permission!=='granted')return;
  const a=smartAlertCounts();if(!a.total)return;
  const key=JSON.stringify({d:a.due,s:a.soon,l:a.low,e:a.empty,o:a.overdue})+todayKey();
  if(!force&&localStorage.getItem('stockpro_last_notification')===key)return;
  localStorage.setItem('stockpro_last_notification',key);
  const lang=currentLanguage;const title=lang==='fr'?'Stock Pro — Alertes':lang==='en'?'Stock Pro — Alerts':'Stock Pro — تنبيهات';
  const body=lang==='fr'?`Urgent: ${a.due+a.overdue} | Bientôt: ${a.soon} | Seuil minimum: ${a.low} | Rupture: ${a.empty}`:lang==='en'?`Urgent: ${a.due+a.overdue} | Soon: ${a.soon} | Minimum: ${a.low} | Out: ${a.empty}`:`عاجل: ${a.due+a.overdue} | قريب: ${a.soon} | الحد الأدنى: ${a.low} | نفاذ: ${a.empty}`;
  try{new Notification(title,{body,tag:'stock-pro-alerts'})}catch(e){}
}
const _v21_statistics=statistics;
statistics=function(){_v21_statistics();renderV22Alerts();notifySmartAlerts();};
const _v21_loadAll=loadAll;
loadAll=async function(){await _v21_loadAll();renderV22Alerts();notifySmartAlerts();};
const _v21_changeLanguage=changeLanguage;
changeLanguage=function(lang){_v21_changeLanguage(lang);renderV22Alerts();updateNotificationStatus();};
loadTheme();updateNotificationStatus();

/* ===== Equipment type translations ===== */
(function(){
 const map={
  'ملابس العمل':{fr:'Bleu de travail',en:'Workwear'},
  'bleu de travail':{fr:'Bleu de travail',en:'Workwear'},
  'أحذية السلامة':{fr:'Chaussures de sécurité',en:'Safety shoes'},
  'chaussures de sécurité':{fr:'Chaussures de sécurité',en:'Safety shoes'},
  'القفازات':{fr:'Gants',en:'Gloves'},
  'les gant':{fr:'Gants',en:'Gloves'},
  'les gants':{fr:'Gants',en:'Gloves'},
  'gants':{fr:'Gants',en:'Gloves'},
  'سترة اللحام':{fr:'Vest soudeur',en:'Welding vest'},
  'vest soudeur':{fr:'Vest soudeur',en:'Welding vest'},
  'قفازات اللحام':{fr:'Gants soudeur',en:'Welding gloves'},
  'les gant soudeur':{fr:'Gants soudeur',en:'Welding gloves'},
  'les gants soudeur':{fr:'Gants soudeur',en:'Welding gloves'},
  'gants soudeur':{fr:'Gants soudeur',en:'Welding gloves'},
  'نظارات السلامة':{fr:'Lunettes de sécurité',en:'Safety glasses'},
  'les nuette de sécurité':{fr:'Lunettes de sécurité',en:'Safety glasses'},
  'les lunettes de sécurité':{fr:'Lunettes de sécurité',en:'Safety glasses'},
  'lunettes de sécurité':{fr:'Lunettes de sécurité',en:'Safety glasses'}
 };
 window.translateEquipmentType=function(v){
  if(!v)return v;
  const k=String(v).trim().toLowerCase();
  const x=map[k];
  if(!x)return v;
  const lang=window.currentLanguage||localStorage.getItem('stockpro_lang')||'ar';
  return lang==='fr'?x.fr:lang==='en'?x.en:v;
 };
 window.refreshEquipmentTypeTexts=function(){
  document.querySelectorAll('[data-equipment-type]').forEach(el=>{
   el.textContent=translateEquipmentType(el.dataset.equipmentType);
  });
 };
})();

(function(){
 const status=document.getElementById('refreshStatus');
 function show(t){if(!status)return;status.textContent=t;status.classList.add('show');setTimeout(()=>status.classList.remove('show'),1800)}
 async function refreshAppData(){
  try{
   show('🔄 جاري تحديث البيانات...');
   const fns=['loadProducts','loadWorkers','loadEquipment','loadMovements','loadTransactions','renderDashboard','renderProducts','renderWorkers','renderEquipment','renderMovements','updateDashboard','updateStats','updateTodayStats','updateDueItems'];
   for(const n of fns) if(typeof window[n]==='function'){try{await window[n]()}catch(e){console.warn(n,e)}}
   show('✅ تم تحديث البيانات');
  }catch(e){console.error(e);show('⚠️ تعذر تحديث بعض البيانات')}
 }
 window.refreshAppData=refreshAppData;
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshAppData()});
 window.addEventListener('focus',refreshAppData);
 setInterval(refreshAppData,60000);
 setTimeout(refreshAppData,1200);
})();