const SUPABASE_URL="https://mpanymikmqajpppipmxy.supabase.co";
const SUPABASE_ANON_KEY="sb_publishable_gFcCXJ4jzWl4P8CDBi-uhQ_Gkr1EHa4";
const db=supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
const ADMIN_EMAIL="azizsolo.190@gmail.com";
const MASTER_ADMIN_EMAIL=ADMIN_EMAIL;
let currentUser=null,isAdmin=false,products=[],workers=[],equipment=[],metrology=[],movements=[],users=[],movementType="entry",deferredPrompt=null;

function safe(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function errText(e){return e?.message||e?.details||e?.hint||"خطأ غير معروف"}
function todayKey(){return new Date().toISOString().slice(0,10)}
function formatDate(v){if(!v)return "-";try{return new Date(v+"T00:00:00").toLocaleDateString("ar-DZ")}catch(e){return v}}
function toast(t){const e=document.getElementById("toast");if(!e)return;clearTimeout(window.__toastTimer);e.textContent=t;e.classList.add("show");window.__toastTimer=setTimeout(()=>e.classList.remove("show"),3000)}
function closeModal(id){document.getElementById(id)?.classList.remove("show")}

async function login(e){
 e.preventDefault();
 const email=document.getElementById("loginEmail").value.trim();
 const password=document.getElementById("loginPassword").value;
 const btn=document.getElementById("loginBtn");
 const er=document.getElementById("loginError");
 er.style.display="none";
 btn.disabled=true;
 btn.textContent="جاري الدخول...";
 const {data,error}=await db.auth.signInWithPassword({email,password});
 btn.disabled=false;
 btn.textContent="دخول إلى التطبيق";
 if(error){
   console.error(error);
   er.textContent=error.message||"البريد الإلكتروني أو كلمة المرور غير صحيحة";
   er.style.display="block";
   return;
 }
 currentUser=data.user;
 await afterLogin();
}

async function afterLogin(){
 document.getElementById("loginScreen").style.display="none";
 document.getElementById("app").style.display="block";
 document.getElementById("topUserEmail").textContent=currentUser?.email||"";
 await loadProfile();
 await loadAll();
 await loadUsers();
}

async function loadProfile(){
 if(!currentUser)return;
 const {data,error}=await db.from("profiles").select("*").eq("id",currentUser.id).maybeSingle();
 if(error){console.error(error);return}
 if(data){
   isAdmin=data.role==="admin"||String(currentUser.email||"").toLowerCase()===MASTER_ADMIN_EMAIL.toLowerCase();
   if(data.is_blocked){
     await db.auth.signOut();
     currentUser=null;
     document.getElementById("app").style.display="none";
     document.getElementById("loginScreen").style.display="flex";
     toast("هذا الحساب موقوف ⛔");
     return;
   }
 }
 document.getElementById("adminNav")?.classList.toggle("show",isAdmin);
}

function isMasterAdmin(){
 return String(currentUser?.email||"").toLowerCase()===MASTER_ADMIN_EMAIL.toLowerCase();
}

async function logout(){
 await db.auth.signOut();
 currentUser=null;
 isAdmin=false;
 document.getElementById("app").style.display="none";
 document.getElementById("loginScreen").style.display="flex";
 document.getElementById("loginPassword").value="";
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
 const {data,error}=await db.from("products").select("*").eq("user_id",currentUser.id).order("name");
 if(error){toast("خطأ في تحميل المنتجات ❌");console.error(error);return}
 products=data||[];
 renderProducts();
 statistics();
}

function renderProducts(){
 const box=document.getElementById("productsList");
 if(!box)return;
 const q=(document.getElementById("stockSearch")?.value||"").toLowerCase().trim();
 box.innerHTML="";
 products
 .filter(p=>
   String(p.name||"").toLowerCase().includes(q)||
   String(p.reference||p.ref||"").toLowerCase().includes(q)
 )
 .forEach(p=>{
   const qty=Number(p.quantity||0);
   const min=Number(p.min_quantity??p.min_qty??0);
   const d=document.createElement("div");
   d.className="product";
   d.innerHTML=`
   <div class="product-main">
    <div class="product-info">
     <div class="product-icon">📦</div>
     <div>
      <div class="product-name">${safe(p.name)}</div>
      <div class="product-ref">${safe(p.reference||p.ref||"")}</div>
     </div>
    </div>
    <div class="quantity ${qty<=min?"low":"good"}">
     ${qty}
     <small>الكمية</small>
    </div>
   </div>
   <div class="product-actions">
    <button class="small-btn edit" onclick="openProduct('${safe(p.id)}')">✏️ تعديل</button>
    <button class="small-btn delete" onclick="deleteProduct('${safe(p.id)}')">🗑️ حذف</button>
   </div>`;
   box.appendChild(d);
 });
 if(!box.children.length)box.innerHTML='<div class="info-box" style="text-align:center">لا توجد منتجات.</div>';
}

function openProduct(id){
 const p=id?products.find(x=>String(x.id)===String(id)):null;
 document.getElementById("productId").value=p?.id||"";
 document.getElementById("productName").value=p?.name||"";
 document.getElementById("productRef").value=p?.reference||p?.ref||"";
 document.getElementById("productQty").value=p?.quantity??0;
 document.getElementById("productMin").value=p?.min_quantity??p?.min_qty??0;
 document.getElementById("productModal").classList.add("show");
}

async function saveProduct(e){
 e.preventDefault();
 if(!currentUser)return;
 const id=document.getElementById("productId").value;
 const obj={
   user_id:currentUser.id,
   name:document.getElementById("productName").value.trim(),
   reference:document.getElementById("productRef").value.trim(),
   quantity:Number(document.getElementById("productQty").value)||0,
   min_quantity:Number(document.getElementById("productMin").value)||0
 };
 if(!obj.name)return toast("أدخل اسم المنتج ❌");
 let r;
 if(id)r=await db.from("products").update(obj).eq("id",id).eq("user_id",currentUser.id);
 else r=await db.from("products").insert(obj);
 if(r.error){console.error(r.error);return toast("تعذر حفظ المنتج: "+errText(r.error))}
 closeModal("productModal");
 await loadProducts();
 toast(id?"تم تعديل المنتج ✅":"تمت إضافة المنتج ✅");
}

async function deleteProduct(id){
 const p=products.find(x=>String(x.id)===String(id));
 if(!p||!confirm("هل أنت متأكد من حذف المنتج؟\n\n"+p.name))return;
 const {error}=await db.from("products").delete().eq("id",id).eq("user_id",currentUser.id);
 if(error)return toast("تعذر حذف المنتج: "+errText(error));
 await loadProducts();
 toast("تم حذف المنتج ✅");
}

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

 workers
 .filter(w=>
   (w.name||"").toLowerCase().includes(q)||
   (w.matricule||"").toLowerCase().includes(q)
 )
 .forEach(w=>{
   const d=document.createElement("div");
   d.className="worker";

   d.innerHTML=`
   <div class="worker-main">
    <div class="worker-info">
     <div class="worker-icon">👷</div>
     <div>
      <div class="worker-name">${safe(w.name)}</div>
      <div class="worker-matricule">${safe(w.matricule)}</div>
      <div style="font-size:11px;color:#6b7280;margin-top:4px">${safe(w.job||"")}</div>
     </div>
    </div>
    <span class="worker-status ${w.status==="inactive"?"inactive":""}">
     ${w.status==="inactive"?"غير نشط":"نشط"}
    </span>
   </div>
   <div class="product-actions">
    <button class="small-btn delete" onclick="deleteWorker('${safe(w.id)}')">🗑️ حذف</button>
   </div>`;

   box.appendChild(d);
 });

 if(!box.children.length)
  box.innerHTML='<div class="info-box" style="text-align:center">لا يوجد عمال.</div>';
}

function openWorker(){
 document.getElementById("workerMatricule").value="";
 document.getElementById("workerName").value="";
 document.getElementById("workerRole").value="";
 document.getElementById("workerModal").classList.add("show");
}

async function saveWorker(e){
 e.preventDefault();

 if(!currentUser)
  return toast("يجب تسجيل الدخول أولاً ❌");

 const matricule=document.getElementById("workerMatricule").value.trim();
 const name=document.getElementById("workerName").value.trim();
 const job=document.getElementById("workerRole").value.trim();

 if(!matricule||!name)
  return toast("أدخل Matricule واسم العامل ❌");

 const exists=workers.some(w =>
  String(w.matricule||"").trim().toLowerCase()===matricule.toLowerCase()
 );

 if(exists)
  return toast("هذا الـ Matricule موجود بالفعل ❌");

 const obj={
  user_id:currentUser.id,
  matricule,
  name,
  job,
  status:"active"
 };

 const {error}=await db
  .from("workers")
  .insert(obj);

 if(error){
  console.error("❌ إضافة العامل:",error);
  return toast("تعذر إضافة العامل: "+errText(error));
 }

 closeModal("workerModal");

 await loadWorkers();
 await loadEquipment();

 renderWorkers();
 renderEquipment();
 renderDue();

 toast("تمت إضافة العامل وظهر في التجهيزات مباشرة ✅");
}

async function deleteWorker(id){
 const w=workers.find(x=>String(x.id)===String(id));

 if(!w||!confirm("هل أنت متأكد من حذف العامل؟\n\n"+w.name))
  return;

 const eq=await db
  .from("equipment")
  .delete()
  .eq("worker_id",id)
  .eq("user_id",currentUser.id);

 if(eq.error){
  console.error(eq.error);
  return toast("تعذر حذف تجهيزات العامل: "+errText(eq.error));
 }

 const {error}=await db
  .from("workers")
  .delete()
  .eq("id",id)
  .eq("user_id",currentUser.id);

 if(error){
  toast("تعذر حذف العامل: "+errText(error));
  return;
 }

 await loadWorkers();
 await loadEquipment();

 renderDue();
 statistics();

 toast("تم حذف العامل وتجهيزاته السابقة ✅");
}

async function loadEquipment(){
 if(!currentUser)return;

 const {data,error}=await db
  .from("equipment")
  .select("*")
  .eq("user_id",currentUser.id);

 if(error){
  toast("خطأ في تحميل التجهيزات ❌");
  console.error(error);
  return;
 }

 equipment=data||[];

 renderEquipment();
 renderDue();
}

function interval(t){
 return t==="shoes"?{m:12,d:0}:
        t==="bleu"?{m:6,d:0}:
        t==="glasses"?{m:6,d:0}:
        t==="gants"?{m:0,d:35}:
        {m:6,d:0};
}

function nextDue(date,type){
 const d=new Date(date+"T00:00:00");
 const x=interval(type);
 if(x.m)d.setMonth(d.getMonth()+x.m);
 if(x.d)d.setDate(d.getDate()+x.d);
 return d.toISOString().slice(0,10);
}

function dueStatus(date){
 if(!date)return"none";

 const now=new Date();
 now.setHours(0,0,0,0);

 const d=new Date(date+"T00:00:00");
 const diff=Math.ceil((d-now)/86400000);

 if(diff<0)return"due";
 if(diff<=30)return"soon";
 return"notdue";
}

function remainingText(date){
 if(!date)return"لم يُسلّم";

 const now=new Date();
 now.setHours(0,0,0,0);

 const d=new Date(date+"T00:00:00");
 const diff=Math.ceil((d-now)/86400000);

 if(diff<0)return`متأخر بـ ${Math.abs(diff)} يوم`;
 if(diff===0)return"مستحق اليوم";
 if(diff===1)return"باقي يوم واحد";
 return`باقي ${diff} يوم`;
}

function equipmentLabel(t){
 return t==="shoes"?"أحذية السلامة":
        t==="bleu"?"ملابس العمل":
        t==="glasses"?"نظارات السلامة":
        t==="gants"?"القفازات":
        "سترة اللحام";
}

function statusText(s){
 return s==="due"?"مستحق":
        s==="soon"?"قريب":
        s==="notdue"?"غير مستحق":
        "لم يُسلّم";
}

async function openEquipment(){

 await loadWorkers();

 const s=document.getElementById("equipmentWorker");

 s.innerHTML='<option value="">اختر العامل...</option>';

 workers
 .filter(w=>w.status!=="inactive")
 .forEach(w=>{
  const o=document.createElement("option");

  o.value=w.matricule;
  o.textContent=`${w.name} (${w.matricule})`;

  s.appendChild(o);
 });

 document.getElementById("equipmentDate").value=todayKey();

 document.getElementById("equipmentDueDate").value=
  nextDue(
   todayKey(),
   document.getElementById("equipmentType").value
  );

 document.getElementById("equipmentQty").value=1;
 document.getElementById("equipmentBon").value="";
 document.getElementById("equipmentNote").value="";

 s.onchange=loadExistingEquipmentForEdit;

 document.getElementById("equipmentType").onchange=
  loadExistingEquipmentForEdit;

 document.getElementById("equipmentDate").onchange=function(){
  updateEquipmentDueDate(true);
 };

 document.getElementById("equipmentModal").classList.add("show");
}

function loadExistingEquipmentForEdit(){
 const matricule=document.getElementById("equipmentWorker").value;
 const type=document.getElementById("equipmentType").value;

 const w=workers.find(x=>String(x.matricule)===String(matricule));

 const e=w?
  equipment.find(x=>
   String(x.worker_id)===String(w.id)&&
   String(x.type)===String(type)
  ):null;

 if(e){
  document.getElementById("equipmentDate").value=
   e.last_date||todayKey();

  document.getElementById("equipmentDueDate").value=
   e.due_date||
   nextDue(
    document.getElementById("equipmentDate").value,
    type
   );

  document.getElementById("equipmentQty").value=e.quantity||1;
  document.getElementById("equipmentBon").value=e.bon||"";
  document.getElementById("equipmentNote").value=e.note||"";
 }else{
  const d=todayKey();

  document.getElementById("equipmentDate").value=d;

  document.getElementById("equipmentDueDate").value=
   nextDue(d,type);

  document.getElementById("equipmentQty").value=1;
  document.getElementById("equipmentBon").value="";
  document.getElementById("equipmentNote").value="";
 }
}

async function saveEquipment(e){
 e.preventDefault();

 if(!currentUser)
  return toast("يجب تسجيل الدخول أولاً ❌");

 const matricule=document.getElementById("equipmentWorker").value;
 const type=document.getElementById("equipmentType").value;
 const date=document.getElementById("equipmentDate").value;
 const due=document.getElementById("equipmentDueDate").value;
 const quantity=Number(document.getElementById("equipmentQty").value)||1;
 const bon=document.getElementById("equipmentBon").value.trim();
 const note=document.getElementById("equipmentNote").value.trim();

 if(!matricule||!type)
  return toast("اختر العامل ونوع التجهيز ❌");

 const w=workers.find(x=>String(x.matricule)===String(matricule));

 if(!w)
  return toast("العامل غير موجود ❌");

 const existing=equipment.find(x=>
  String(x.worker_id)===String(w.id)&&
  String(x.type)===String(type)
 );

 const obj={
  user_id:currentUser.id,
  worker_id:w.id,
  type,
  last_date:date,
  due_date:due,
  quantity,
  bon,
  note
 };

 let r;

 if(existing){
  r=await db
   .from("equipment")
   .update(obj)
   .eq("id",existing.id)
   .eq("user_id",currentUser.id);
 }else{
  r=await db
   .from("equipment")
   .insert(obj);
 }

 if(r.error){
  console.error(r.error);
  return toast("تعذر حفظ التجهيز: "+errText(r.error));
 }

 closeModal("equipmentModal");

 await loadEquipment();

 toast(existing?"تم تحديث التجهيز ✅":"تم تسجيل التجهيز ✅");
}

function updateEquipmentDueDate(force){
 const date=document.getElementById("equipmentDate").value;
 const type=document.getElementById("equipmentType").value;

 if(date&&type)
  document.getElementById("equipmentDueDate").value=
   nextDue(date,type);
}

function renderEquipment(){
 const box=document.getElementById("equipmentList");
 if(!box)return;

 const q=(document.getElementById("equipmentSearch")?.value||"")
  .toLowerCase()
  .trim();

 box.innerHTML="";

 workers
 .filter(w=>
  (w.name||"").toLowerCase().includes(q)||
  (w.matricule||"").toLowerCase().includes(q)
 )
 .forEach(w=>{

  let rows="";

  ["shoes","bleu","glasses","gants","vest_soudeur"]
  .forEach(t=>{

   const e=equipment.find(x=>
    String(x.worker_id)===String(w.id)&&
    x.type===t
   );

   const s=e?dueStatus(e.due_date):"none";
   const txt=e?remainingText(e.due_date):"لم يُسلّم";

   rows+=`
   <div style="display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid #eee">
    <div>
     <b>${equipmentLabel(t)}</b>
     <div class="equipment-duration">آخر تسليم: ${formatDate(e?.last_date)}</div>
     <div class="equipment-duration">تاريخ الاستحقاق: ${formatDate(e?.due_date)}</div>
     <div style="font-weight:bold;margin-top:3px" class="equip-state-${s}">
      ${txt}
     </div>
    </div>
    <span class="status status-${s}">
     ${statusText(s)}
    </span>
   </div>`;
  });

  const d=document.createElement("div");
  d.className="equipment";

  d.innerHTML=`
  <div class="equipment-top">
   <div class="equipment-info">
    <div class="equipment-icon">👕</div>
    <div>
     <div class="equipment-name">${safe(w.name)}</div>
     <div class="worker-matricule">${safe(w.matricule)}</div>
    </div>
   </div>
  </div>
  <div style="margin-top:10px">${rows}</div>`;

  box.appendChild(d);
 });

 if(!box.children.length)
  box.innerHTML='<div class="info-box" style="text-align:center">لا توجد بيانات تجهيزات.</div>';
}

function renderDue(){
 const box=document.getElementById("dueList");
 if(!box)return;

 const q=(document.getElementById("dueSearch")?.value||"")
  .toLowerCase()
  .trim();

 box.innerHTML="";

 let count=0;

 workers
 .filter(w=>w.status!=="inactive")
 .forEach(w=>{

  if(
   q&&
   !(`${w.name||""} ${w.matricule||""}`)
    .toLowerCase()
    .includes(q)
  )return;

  let rows="";

  ["shoes","bleu","glasses","gants","vest_soudeur"]
  .forEach(t=>{

   const e=equipment.find(x=>
    String(x.worker_id)===String(w.id)&&
    x.type===t
   );

   const s=e?dueStatus(e.due_date):"none";

   if(s==="due")count++;

   const txt=e?remainingText(e.due_date):"لم يُسلّم";

   rows+=`
   <div style="padding:9px 0;border-bottom:1px solid #eee">
    <b>${equipmentLabel(t)}</b>
    <div class="equipment-duration">آخر تسليم: ${formatDate(e?.last_date)}</div>
    <div class="equipment-duration">تاريخ الاستحقاق: ${formatDate(e?.due_date)}</div>
    <div style="font-weight:bold" class="equip-state-${s}">
     ${txt}
    </div>
    <span class="status status-${s}" style="display:inline-block;margin-top:5px">
     ${statusText(s)}
    </span>
   </div>`;
  });

  if(rows){
   const d=document.createElement("div");
   d.className="equipment";

   d.innerHTML=`
   <div class="worker-name">
    ${safe(w.name)}
    <small>(${safe(w.matricule)})</small>
   </div>
   <div style="margin-top:8px">${rows}</div>`;

   box.appendChild(d);
  }
 });

 const today=document.getElementById("dueToday");
 if(today)today.textContent=count;

 if(!box.children.length)
  box.innerHTML='<div class="info-box" style="text-align:center">لا توجد استحقاقات حالياً.</div>';
}

function statistics(){
 const p=document.getElementById("productsNumber");
 if(p)p.textContent=products.length;

 let en=0,ex=0,t=todayKey();

 movements.forEach(m=>{
  if((m.created_at||"").slice(0,10)===t){
   if(m.type==="entry")en+=Number(m.quantity)||0;
   if(m.type==="exit")ex+=Number(m.quantity)||0;
  }
 });

 const a=document.getElementById("entryToday");
 if(a)a.textContent=en;

 const b=document.getElementById("exitToday");
 if(b)b.textContent=ex;

 renderDue();
}

async function loadMovements(){
 if(!currentUser)return;

 const {data,error}=await db
  .from("movements")
  .select("*")
  .eq("user_id",currentUser.id)
  .order("created_at",{ascending:false});

 if(error){
  console.error(error);
  return;
 }

 movements=data||[];
 renderMovements();
 statistics();
}

function renderMovements(){
 const box=document.getElementById("movementsList");
 if(!box)return;

 const q=(document.getElementById("movementSearch")?.value||"")
  .toLowerCase()
  .trim();

 box.innerHTML="";

 movements
 .filter(m=>
  `${m.type||""} ${m.bon||""} ${m.note||""}`
   .toLowerCase()
   .includes(q)
 )
 .forEach(m=>{
  const d=document.createElement("div");
  d.className="product";

  d.innerHTML=`
  <div class="product-main">
   <div>
    <div class="product-name">
     ${m.type==="entry"?"📥 دخول":"📤 خروج"}
    </div>
    <div class="product-ref">${safe(m.bon||"")}</div>
    <div class="product-ref">${formatDate((m.created_at||"").slice(0,10))}</div>
   </div>
   <div class="quantity">
    ${Number(m.quantity)||0}
    <small>الكمية</small>
   </div>
  </div>`;

  box.appendChild(d);
 });

 if(!box.children.length)
  box.innerHTML='<div class="info-box" style="text-align:center">لا توجد حركات.</div>';
}

function openMovement(type){
 movementType=type;

 document.getElementById("movementType").value=type;

 const s=document.getElementById("movementProduct");
 s.innerHTML='<option value="">اختر المنتج...</option>';

 products.forEach(p=>{
  const o=document.createElement("option");
  o.value=p.id;
  o.textContent=`${p.name} (${p.quantity||0})`;
  s.appendChild(o);
 });

 document.getElementById("movementQty").value=1;
 document.getElementById("movementBon").value="";
 document.getElementById("movementNote").value="";

 document.getElementById("movementModal").classList.add("show");
}

async function saveMovement(e){
 e.preventDefault();

 if(!currentUser)return;

 const productId=document.getElementById("movementProduct").value;
 const qty=Number(document.getElementById("movementQty").value)||0;
 const bon=document.getElementById("movementBon").value.trim();
 const note=document.getElementById("movementNote").value.trim();

 if(!productId||qty<=0)
  return toast("اختر المنتج والكمية ❌");

 const p=products.find(x=>String(x.id)===String(productId));

 if(!p)return toast("المنتج غير موجود ❌");

 const oldQty=Number(p.quantity)||0;
 const newQty=movementType==="entry"
  ?oldQty+qty
  :oldQty-qty;

 if(movementType==="exit"&&newQty<0)
  return toast("الكمية غير كافية في المخزون ❌");

 const r1=await db
  .from("products")
  .update({quantity:newQty})
  .eq("id",productId)
  .eq("user_id",currentUser.id);

 if(r1.error)
  return toast("تعذر تحديث المخزون: "+errText(r1.error));

 const r2=await db
  .from("movements")
  .insert({
   user_id:currentUser.id,
   product_id:productId,
   type:movementType,
   quantity:qty,
   bon,
   note
  });

 if(r2.error){
  console.error(r2.error);
  await db.from("products")
   .update({quantity:oldQty})
   .eq("id",productId)
   .eq("user_id",currentUser.id);

  return toast("تعذر تسجيل الحركة: "+errText(r2.error));
 }

 closeModal("movementModal");

 await loadProducts();
 await loadMovements();

 toast("تم تسجيل الحركة ✅");
}

async function loadMetrology(){
 if(!currentUser)return;

 const {data,error}=await db
  .from("metrology")
  .select("*")
  .eq("user_id",currentUser.id)
  .order("name");

 if(error){
  console.error(error);
  return;
 }

 metrology=data||[];
 renderMetrology();
}

function metrologyDurationLabel(m){
 if(Number(m)===6)return"6 أشهر";
 if(Number(m)===12)return"سنة";
 return `${m||0} شهر`;
}

function metrologyStatus(date){
 if(!date)return"due";

 const now=new Date();
 now.setHours(0,0,0,0);

 const d=new Date(date+"T00:00:00");
 const diff=Math.ceil((d-now)/86400000);

 if(diff<0)return"due";
 if(diff<=30)return"soon";
 return"notdue";
}

function metrologyRemaining(date){
 if(!date)return"غير محدد";

 const now=new Date();
 now.setHours(0,0,0,0);

 const d=new Date(date+"T00:00:00");
 const diff=Math.ceil((d-now)/86400000);

 if(diff<0)return`منتهي منذ ${Math.abs(diff)} يوم`;
 if(diff===0)return"ينتهي اليوم";
 return`باقي ${diff} يوم`;
}

function renderMetrology(){
 const box=document.getElementById("metrologyList");
 if(!box)return;

 const q=(document.getElementById("metrologySearch")?.value||"")
  .toLowerCase()
  .trim();

 box.innerHTML="";

 let valid=0,soon=0,expired=0;

 const list=metrology.filter(x=>
  `${x.name||""} ${x.reference||""} ${x.serial_number||""}`
   .toLowerCase()
   .includes(q)
 );

 list.forEach(x=>{
  const st=metrologyStatus(x.expiry_date);

  if(st==="notdue")valid++;
  else if(st==="soon")soon++;
  else if(st==="due")expired++;

  const d=document.createElement("div");
  d.className="equipment";

  d.innerHTML=`
  <div class="equipment-top">
   <div class="equipment-info">
    <div class="equipment-icon">📏</div>
    <div>
     <div class="equipment-name">${safe(x.name)}</div>
     <div class="worker-matricule">
      ${safe(x.reference||"بدون Référence")}
      ${x.serial_number?" · S/N "+safe(x.serial_number):""}
     </div>
    </div>
   </div>
   <span class="status status-${st}">
    ${st==="due"?"منتهي":st==="soon"?"قريب الانتهاء":"صالح"}
   </span>
  </div>

  <div style="margin-top:10px">
   <div class="equipment-duration">
    📅 تاريخ الطالوناج: <b>${formatDate(x.calibration_date)}</b>
   </div>
   <div class="equipment-duration">
    ⏱️ مدة الطالوناج: <b>${metrologyDurationLabel(x.calibration_duration_months)}</b>
   </div>
   <div class="equipment-duration">
    📅 نهاية الطالوناج: <b>${formatDate(x.expiry_date)}</b>
   </div>
   <div style="font-weight:bold;margin-top:5px" class="equip-state-${st}">
    ${metrologyRemaining(x.expiry_date)}
   </div>
   ${x.note?`<div class="equipment-duration">📝 ${safe(x.note)}</div>`:""}
  </div>

  <div class="product-actions" style="margin-top:10px">
   <button class="small-btn edit" onclick="openMetrology('${safe(x.id)}')">✏️ تعديل</button>
   <button class="small-btn delete" onclick="deleteMetrology('${safe(x.id)}')">🗑️ حذف</button>
  </div>`;

  box.appendChild(d);
 });

 const stats=document.getElementById("metrologyStats");

 if(stats)
 stats.innerHTML=`
 <div class="stat">
  <div class="icon green">🟢</div>
  <div><span>صالح</span><strong>${valid}</strong></div>
 </div>
 <div class="stat">
  <div class="icon orange">🟡</div>
  <div><span>قريب الانتهاء</span><strong>${soon}</strong></div>
 </div>
 <div class="stat">
  <div class="icon red">🔴</div>
  <div><span>منتهي</span><strong>${expired}</strong></div>
 </div>`;

 if(!box.children.length)
  box.innerHTML='<div class="info-box" style="text-align:center">لا توجد معدات ميترولوجي مسجلة.</div>';
}

function openMetrology(id){
 const x=id?metrology.find(v=>String(v.id)===String(id)):null;

 document.getElementById("metrologyId").value=x?.id||"";
 document.getElementById("metrologyName").value=x?.name||"";
 document.getElementById("metrologyReference").value=x?.reference||"";
 document.getElementById("metrologySerial").value=x?.serial_number||"";
 document.getElementById("metrologyCalibrationDate").value=x?.calibration_date||todayKey();
 document.getElementById("metrologyDuration").value=x?.calibration_duration_months||12;
 document.getElementById("metrologyNote").value=x?.note||"";

 updateMetrologyExpiry();

 document.getElementById("metrologyModal").classList.add("show");
}

function updateMetrologyExpiry(){
 const d=document.getElementById("metrologyCalibrationDate").value;
 const m=Number(document.getElementById("metrologyDuration").value)||12;

 if(!d)return;

 const x=new Date(d+"T00:00:00");
 x.setMonth(x.getMonth()+m);

 document.getElementById("metrologyExpiry").value=
  x.toISOString().slice(0,10);
}

async function saveMetrology(e){
 e.preventDefault();

 if(!currentUser)return;

 const id=document.getElementById("metrologyId").value;

 const obj={
  user_id:currentUser.id,
  name:document.getElementById("metrologyName").value.trim(),
  reference:document.getElementById("metrologyReference").value.trim(),
  serial_number:document.getElementById("metrologySerial").value.trim(),
  calibration_date:document.getElementById("metrologyCalibrationDate").value,
  calibration_duration_months:Number(document.getElementById("metrologyDuration").value)||12,
  expiry_date:document.getElementById("metrologyExpiry").value,
  note:document.getElementById("metrologyNote").value.trim()
 };

 if(!obj.name)
  return toast("أدخل اسم المعدات ❌");

 let r;

 if(id){
  r=await db
   .from("metrology")
   .update(obj)
   .eq("id",id)
   .eq("user_id",currentUser.id);
 }else{
  r=await db.from("metrology").insert(obj);
 }

 if(r.error){
  console.error(r.error);
  return toast("تعذر حفظ المعدات: "+errText(r.error));
 }

 closeModal("metrologyModal");
 await loadMetrology();

 toast(id?"تم تعديل معدات الميترولوجي ✅":"تمت إضافة معدات الميترولوجي ✅");
}

async function deleteMetrology(id){
 if(!confirm("هل أنت متأكد من حذف هذه المعدات؟"))return;

 const {error}=await db
  .from("metrology")
  .delete()
  .eq("id",id)
  .eq("user_id",currentUser.id);

 if(error)
  return toast("تعذر الحذف: "+errText(error));

 await loadMetrology();

 toast("تم الحذف ✅");
}

function renderHomeProducts(){
 const box=document.getElementById("homeProductsList");
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
     <div class="product-name">${safe(p.name)}</div>
     <div class="product-ref">${safe(p.reference||"")}</div>
    </div>
   </div>
   <div class="quantity">
    ${Number(p.quantity)||0}
    <small>الكمية</small>
   </div>
  </div>`;

  box.appendChild(d);
 });

 if(!box.children.length)
  box.innerHTML='<div class="info-box" style="text-align:center">لا توجد منتجات.</div>';
}

function showPage(id,btn){
 document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
 document.getElementById(id)?.classList.add("active");

 document.querySelectorAll(".nav button").forEach(b=>b.classList.remove("active"));
 btn?.classList.add("active");

 if(id==="workers")loadWorkers();
 if(id==="equipment"){
  loadWorkers();
  loadEquipment();
 }
 if(id==="metrology")loadMetrology();
 if(id==="due"){
  loadWorkers();
  loadEquipment();
 }
 if(id==="admin")loadUsers();
}

function activatePage(id){
 const btn=[...document.querySelectorAll(".nav button")]
  .find(b=>b.getAttribute("onclick")?.includes(`'${id}'`));

 showPage(id,btn);
}

function activateStockFilter(type){
 activatePage("stock");

 const input=document.getElementById("stockSearch");
 if(!input)return;

 if(type==="empty")input.value="";
 if(type==="low")input.value="";

 renderProducts();
}

function changeLanguage(lang){
 currentLanguage=lang;
 localStorage.setItem("stockpro_lang",lang);

 document.querySelectorAll("[data-i18n]").forEach(el=>{
  const k=el.dataset.i18n;
  const t={
   home:{ar:"الرئيسية",fr:"Accueil",en:"Home"},
   products:{ar:"المخزون",fr:"Stock",en:"Stock"},
   workers:{ar:"العمال",fr:"Employés",en:"Workers"},
   equipment:{ar:"التجهيزات",fr:"Équipements",en:"Equipment"},
   duePage:{ar:"المستحقون",fr:"Échéances",en:"Due"},
   reports:{ar:"التقارير",fr:"Rapports",en:"Reports"},
   settings:{ar:"الإعدادات",fr:"Paramètres",en:"Settings"},
   users:{ar:"إدارة المستخدمين",fr:"Utilisateurs",en:"Users"},
   logout:{ar:"🚪 تسجيل الخروج",fr:"🚪 Déconnexion",en:"🚪 Logout"},
   welcome:{ar:"مرحباً بك 👋",fr:"Bienvenue 👋",en:"Welcome 👋"},
   headerTitle:{ar:"إدارة المخزون والعمال والتجهيزات",fr:"Gestion du stock, employés et équipements",en:"Stock, workers and equipment management"}
  }[k];

  if(t)el.textContent=t[lang]||t.ar;
 });

 renderWorkers();
 renderEquipment();
 renderDue();
 renderProducts();
 renderMetrology();
}

let currentLanguage=localStorage.getItem("stockpro_lang")||"ar";

function togglePassword(){
 const e=document.getElementById("loginPassword");
 if(!e)return;
 e.type=e.type==="password"?"text":"password";
}

function isAppInstalled(){
 return window.matchMedia("(display-mode: standalone)").matches||
        window.navigator.standalone===true;
}

function updateInstallButton(){
 const home=document.getElementById("homeInstallBox");
 const login=document.getElementById("loginInstallButton");

 if(isAppInstalled()){
  if(home)home.style.display="none";
  if(login)login.style.display="none";
  return;
 }

 if(deferredPrompt){
  if(home)home.style.display="block";
  if(login)login.style.display="block";
 }
}

async function installApp(){
 if(isAppInstalled()){
  updateInstallButton();
  return;
 }

 if(!deferredPrompt){
  updateInstallButton();
  return;
 }

 try{
  await deferredPrompt.prompt();

  const r=await deferredPrompt.userChoice;

  deferredPrompt=null;
  updateInstallButton();

  if(r?.outcome==="accepted")
   toast("تم بدء تثبيت التطبيق ✅");
 }catch(e){
  console.warn(e);
  deferredPrompt=null;
  updateInstallButton();
 }
}

async function loadUsers(){
 if(!isMasterAdmin())return;

 const {data,error}=await db
  .from("profiles")
  .select("id,full_name,role,created_at,is_blocked")
  .order("full_name");

 if(error){
  console.error(error);
  toast("تعذر تحميل المستخدمين: "+errText(error));
  return;
 }

 users=data||[];
 renderUsers();
}

function renderUsers(){
 const body=document.getElementById("usersList");
 const q=(document.getElementById("userSearch")?.value||"")
  .toLowerCase()
  .trim();

 if(!body)return;

 body.innerHTML="";

 users
 .filter(u=>
  `${u.full_name||""} ${u.id||""} ${u.role||""}`
   .toLowerCase()
   .includes(q)
 )
 .forEach(u=>{

  const admin=u.role==="admin";
  const self=u.id===currentUser.id;
  const blocked=!!u.is_blocked;

  const tr=document.createElement("tr");

  const roleText=
   admin?
   '<span class="admin-badge">ADMIN</span>':
   '<span>WORKER</span>';

  const state=
   blocked?
   '<span class="status status-notdue">موقوف</span>':
   '<span class="status status-due">نشط</span>';

  let actions="";

  if(self){
   actions='<span style="color:#6b7280;font-size:11px">حسابك — محمي</span>';
  }else{
   actions=`
   <div class="v22-user-actions">
    ${
     admin?
     `<button class="small-btn warning" onclick="setUserRole('${u.id}','worker')">👤 نزع الأدمن</button>`:
     `<button class="small-btn success" onclick="setUserRole('${u.id}','admin')">👑 تعيين أدمن</button>`
    }

    ${
     blocked?
     `<button class="small-btn success" onclick="setUserBlocked('${u.id}',false)">✅ تفعيل</button>`:
     `<button class="small-btn delete" onclick="setUserBlocked('${u.id}',true)">⛔ حظر</button>`
    }

    ${
     blocked?
     `<button class="small-btn warning" onclick="setUserTemporary('${u.id}')">⏱️ توقيف مؤقت</button>`:""
    }
   </div>`;
  }

  tr.className=blocked?"blocked":"";

  tr.innerHTML=`
  <td style="direction:ltr;text-align:left;font-size:10px">${safe(u.id||"-")}</td>
  <td>${safe(u.full_name||"بدون اسم")}</td>
  <td>${roleText}</td>
  <td>${state}</td>
  <td>${actions}</td>`;

  body.appendChild(tr);
 });

 if(!body.children.length)
  body.innerHTML='<tr><td colspan="5" style="text-align:center;padding:25px;color:#6b7280">لا توجد حسابات.</td></tr>';
}

const MASTER_ADMIN_ID="";

function isProtectedUser(id){
 return !id||
        id===currentUser?.id||
        String(currentUser?.email||"").toLowerCase()===MASTER_ADMIN_EMAIL.toLowerCase()&&
        id===currentUser.id;
}

async function adminProfileUpdate(id,values,successMessage){
 if(!isMasterAdmin()||isProtectedUser(id))
  return toast("لا يمكن تعديل حساب الأدمن الرئيسي ❌");

 const {error}=await db
  .from("profiles")
  .update(values)
  .eq("id",id);

 if(error){
  console.error(error);
  toast("تعذر تنفيذ العملية: "+errText(error));
  return;
 }

 await loadUsers();

 toast(successMessage);
}

async function setUserRole(id,role){
 if(!isMasterAdmin()||isProtectedUser(id))return;

 if(!confirm(
  role==="admin"?
  "تعيين هذا المستخدم كأدمن؟":
  "نزع صلاحية الأدمن من هذا المستخدم؟"
 ))return;

 await adminProfileUpdate(
  id,
  {role},
  role==="admin"?
  "تم تعيينه أدمن ✅":
  "تم نزع صلاحية الأدمن ✅"
 );
}

async function setUserBlocked(id,blocked){
 if(!isMasterAdmin()||isProtectedUser(id))return;

 if(!confirm(
  blocked?
  "حظر هذا الحساب؟ يمكن إعادة تفعيله لاحقًا.":
  "إعادة تفعيل هذا الحساب؟"
 ))return;

 await adminProfileUpdate(
  id,
  {is_blocked:blocked},
  blocked?
  "تم حظر الحساب ⛔":
  "تم تفعيل الحساب ✅"
 );
}

async function setUserTemporary(id){
 if(!isMasterAdmin()||isProtectedUser(id))return;

 const raw=prompt(
  "مدة التوقيف المؤقت بالدقائق (مثال: 60):",
  "60"
 );

 const mins=Number(raw);

 if(!Number.isFinite(mins)||mins<=0)return;

 const until=new Date(Date.now()+mins*60000).toISOString();

 const r=await db
  .from("profiles")
  .update({
   is_blocked:true,
   blocked_until:until
  })
  .eq("id",id);

 if(r.error){

  const fallback=await db
   .from("profiles")
   .update({is_blocked:true})
   .eq("id",id);

  if(fallback.error){
   toast("تعذر توقيف الحساب: "+errText(fallback.error));
   return;
  }

  await loadUsers();

  toast("تم توقيف الحساب. لإلغاء التوقيف اضغط تفعيل. ⚠️");
  return;
 }

 await loadUsers();

 toast(`تم توقيف الحساب لمدة ${mins} دقيقة ⏱️`);
}

[
 "stockSearch",
 "workerSearch",
 "equipmentSearch",
 "dueSearch",
 "userSearch",
 "movementSearch",
 "metrologySearch"
].forEach(id=>{
 document.getElementById(id)?.addEventListener("input",()=>{
  if(id==="stockSearch")renderProducts();
  else if(id==="workerSearch")renderWorkers();
  else if(id==="equipmentSearch")renderEquipment();
  else if(id==="dueSearch")renderDue();
  else if(id==="movementSearch")renderMovements();
  else if(id==="metrologySearch")renderMetrology();
  else renderUsers();
 });
});

document.querySelectorAll(".modal").forEach(m=>
 m.addEventListener("click",e=>{
  if(e.target===m)m.classList.remove("show");
 })
);

window.addEventListener("beforeinstallprompt",e=>{
 e.preventDefault();
 deferredPrompt=e;
 updateInstallButton();
});

window.addEventListener("appinstalled",()=>{
 deferredPrompt=null;
 updateInstallButton();
 toast("تم تثبيت Stock Pro على الهاتف ✅");
});

if("serviceWorker" in navigator)
 window.addEventListener("load",()=>
  navigator.serviceWorker
   .register("./sw.js")
   .catch(e=>console.warn("SW:",e))
 );

function setTheme(theme){
 const isDark=theme==="dark";

 document.body.classList.toggle("theme-dark",isDark);

 localStorage.setItem(
  "stockpro_theme",
  isDark?"dark":"light"
 );

 const meta=document.querySelector('meta[name="theme-color"]');

 if(meta)
  meta.setAttribute(
   "content",
   isDark?"#111827":"#f3f4f6"
  );
}

function loadTheme(){
 setTheme(
  localStorage.getItem("stockpro_theme")||"light"
 );
}

function smartAlertCounts(){
 let due=0,soon=0,low=0,overdue=0,empty=0;

 equipment.forEach(e=>{
  const s=dueStatus(e.due_date);

  if(s==="due")due++;
  else if(s==="soon")soon++;
  else if(s==="overdue")overdue++;
 });

 products.forEach(p=>{
  const qty=Number(p.quantity||0);
  const min=Number(p.min_quantity??p.min_qty??0);

  if(qty===0)empty++;
  else if(min>0&&qty<=min)low++;
 });

 const good=products.filter(
  p=>Number(p.quantity||0)>
     Number(p.min_quantity??p.min_qty??0)
 ).length;

 return{
  good,
  due,
  soon,
  low,
  overdue,
  empty,
  total:due+soon+low+overdue+empty
 };
}

function renderV22Alerts(){
 const box=document.getElementById("v22Alerts");

 if(!box)return;

 const a=smartAlertCounts();
 const lang=currentLanguage;

 const t=(ar,fr,en)=>
  lang==="fr"?fr:
  lang==="en"?en:
  ar;

 box.innerHTML=`
 <div class="v22-alert ${a.due||a.overdue?"danger":""} ${a.due||a.overdue?"has-alert":""}" onclick="activatePage('due')">
  <span class="alert-dot"></span>
  🔴 <small>${t("استحقاقات عاجلة","Échéances urgentes","Urgent due")}</small>
  <strong>${a.due+a.overdue}</strong>
 </div>

 <div class="v22-alert ${a.soon?"warning":""} ${a.soon?"has-alert":""}" onclick="activatePage('equipment')">
  <span class="alert-dot"></span>
  🟡 <small>${t("قريبة من الاستحقاق","Bientôt à échéance","Due soon")}</small>
  <strong>${a.soon}</strong>
 </div>

 <div class="v22-alert success ${a.good?"has-alert":""}" onclick="activateStockFilter('available')">
  <span class="alert-dot"></span>
  🟢 <small>${t("المخزون متوفر","Stock disponible","Stock available")}</small>
  <strong>${a.good||0}</strong>
 </div>

 <div class="v22-alert ${a.low?"info":""} ${a.low?"has-alert":""}" onclick="activateStockFilter('low')">
  <span class="alert-dot"></span>
  🔴 <small>${t("بلغ الحد الأدنى","Seuil minimum atteint","Minimum reached")}</small>
  <strong>${a.low}</strong>
 </div>

 <div class="v22-alert danger ${a.empty?"has-alert":""}" onclick="activateStockFilter('empty')">
  <span class="alert-dot"></span>
  🚫 <small>${t("نفاذ المخزون","Rupture de stock","Out of stock")}</small>
  <strong>${a.empty}</strong>
 </div>`;
}

async function enableSmartNotifications(){
 if(!("Notification" in window)){
  toast("المتصفح لا يدعم التنبيهات ❌");
  return;
 }

 try{
  const p=await Notification.requestPermission();

  updateNotificationStatus();

  if(p==="granted"){
   notifySmartAlerts(true);
   toast("تم تفعيل التنبيهات الذكية 🔔");
  }
 }catch(e){
  console.warn(e);
  toast("تعذر تفعيل التنبيهات ❌");
 }
}

function updateNotificationStatus(){
 const e=document.getElementById("notificationStatus");

 if(!e)return;

 const p=
  ("Notification" in window)?
  Notification.permission:
  "unsupported";

 e.textContent=
  p==="granted"?
  "حالة التنبيهات: مفعلة 🔔":
  p==="denied"?
  "حالة التنبيهات: محظورة من المتصفح ⛔":
  "حالة التنبيهات: غير مفعلة";
}

function notifySmartAlerts(force=false){
 if(!("Notification" in window)||
    Notification.permission!=="granted")return;

 const a=smartAlertCounts();

 if(!a.total)return;

 const key=
  JSON.stringify({
   d:a.due,
   s:a.soon,
   l:a.low,
   e:a.empty,
   o:a.overdue
  })+
  todayKey();

 if(
  !force&&
  localStorage.getItem("stockpro_last_notification")===key
 )return;

 localStorage.setItem(
  "stockpro_last_notification",
  key
 );

 const lang=currentLanguage;

 const title=
  lang==="fr"?
  "Stock Pro — Alertes":
  lang==="en"?
  "Stock Pro — Alerts":
  "Stock Pro — تنبيهات";

 const body=
  lang==="fr"?
  `Urgent: ${a.due+a.overdue} | Bientôt: ${a.soon} | Seuil minimum: ${a.low} | Rupture: ${a.empty}`:
  lang==="en"?
  `Urgent: ${a.due+a.overdue} | Soon: ${a.soon} | Minimum: ${a.low} | Out: ${a.empty}`:
  `عاجل: ${a.due+a.overdue} | قريب: ${a.soon} | الحد الأدنى: ${a.low} | نفاذ: ${a.empty}`;

 try{
  new Notification(title,{
   body,
   tag:"stock-pro-alerts"
  });
 }catch(e){}
}

const _v21_statistics=statistics;

statistics=function(){
 _v21_statistics();
 renderV22Alerts();
 notifySmartAlerts();
};

const _v21_loadAll=loadAll;

loadAll=async function(){
 await _v21_loadAll();
 renderV22Alerts();
 notifySmartAlerts();
};

const _v21_changeLanguage=changeLanguage;

changeLanguage=function(lang){
 _v21_changeLanguage(lang);
 renderV22Alerts();
 updateNotificationStatus();
};

loadTheme();
updateNotificationStatus();
updateInstallButton();

window.addEventListener("pageshow",updateInstallButton);
