const SUPABASE_URL="https://mpanymikmqajpppipmxy.supabase.co";
const SUPABASE_ANON_KEY="sb_publishable_gFcCXJ4jzWl4P8CDBi-uhQ_Gkr1EHa4";

const db=supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const ADMIN_EMAIL="azizsolo.190@gmail.com";
const MASTER_ADMIN_EMAIL=ADMIN_EMAIL;

let currentUser=null;
let isAdmin=false;
let products=[];
let workers=[];
let equipment=[];
let metrology=[];
let movements=[];
let users=[];
let movementType="entry";
let deferredPrompt=null;

/* =========================================================
   BASIC HELPERS
========================================================= */

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
  if(!e)return "خطأ غير معروف";
  return e.message ||
         e.error_description ||
         e.details ||
         e.hint ||
         "خطأ غير معروف";
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

/* =========================================================
   AUTH / LOGIN
========================================================= */

function showLogin(){
  const login=document.getElementById("loginScreen");
  const app=document.getElementById("app");

  if(login)login.style.display="flex";
  if(app)app.style.display="none";
}

function showLoginError(m){
  const e=document.getElementById("loginError");

  if(!e)return;

  e.textContent=m;
  e.style.display="block";
}

function isMasterAdmin(){
  return String(currentUser?.email||"").toLowerCase()
    ===MASTER_ADMIN_EMAIL.toLowerCase();
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

  updateInstallButton();
  changeLanguage(currentLanguage);

  const adminNav=document.getElementById("adminNav");
  if(adminNav){
    adminNav.classList.toggle("show",isMasterAdmin());
  }
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

/* =========================================================
   PROFILE
========================================================= */

async function getProfile(user){
  if(!user?.id)return null;

  const {
    data,
    error
  }=await db
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

  if(!user){
    currentUser=null;
    isAdmin=false;
    showLogin();
    return false;
  }

  currentUser=user;

  const p=await getProfile(user);

  const temporaryExpired=
    p?.blocked_until &&
    new Date(p.blocked_until).getTime()<=Date.now();

  if(
    temporaryExpired &&
    p?.is_blocked===true
  ){
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

  if(
   
