<script>

/* =====================================================
   STOCK PRO v3 — SUPABASE
   Gestion de Stock
===================================================== */

const SUPABASE_URL =
"https://mpanymikmqajpppipmxy.supabase.co";

const SUPABASE_KEY =
"sb_publishable_gFcCXJ4jzWl4P8CDBi-uhQ_Gkr1EHa4";


/* =====================================================
   SUPABASE REQUEST
===================================================== */

async function supabaseRequest(
    table,
    method = "GET",
    data = null,
    query = ""
){

    const options = {
        method: method,

        headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": "Bearer " + SUPABASE_KEY,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
    };

    if(data !== null){
        options.body = JSON.stringify(data);
    }

    const response = await fetch(
        SUPABASE_URL +
        "/rest/v1/" +
        table +
        query,
        options
    );

    const text = await response.text();

    let result = null;

    try{
        result = text ? JSON.parse(text) : null;
    }catch{
        result = text;
    }

    if(!response.ok){

        console.error(
            "Supabase Error:",
            result
        );

        throw new Error(
            result?.message ||
            result?.details ||
            "Supabase request failed"
        );
    }

    return result;
}


/* =====================================================
   DATA
===================================================== */

let products = [];
let movements = [];
let workers = [];
let equipment = [];

let movementType = "entry";


/* =====================================================
   LOAD ALL DATA
===================================================== */

async function loadAllData(){

    try{

        showLoading();

        const [
            productsData,
            movementsData,
            workersData,
            equipmentData
        ] = await Promise.all([

            supabaseRequest(
                "products",
                "GET",
                null,
                "?select=*&order=created_at.desc"
            ),

            supabaseRequest(
                "movements",
                "GET",
                null,
                "?select=*&order=created_at.desc"
            ),

            supabaseRequest(
                "workers",
                "GET",
                null,
                "?select=*&order=created_at.desc"
            ),

            supabaseRequest(
                "equipment",
                "GET",
                null,
                "?select=*&order=created_at.desc"
            )

        ]);

        products =
            Array.isArray(productsData)
            ? productsData
            : [];

        movements =
            Array.isArray(movementsData)
            ? movementsData
            : [];

        workers =
            Array.isArray(workersData)
            ? workersData
            : [];

        equipment =
            Array.isArray(equipmentData)
            ? equipmentData
            : [];


        renderProducts();
        renderHomeProducts();
        renderWorkers();
        renderEquipment();
        renderDue();
        statistics();

        hideLoading();

    }catch(error){

        hideLoading();

        console.error(error);

        toast(
            "خطأ في الاتصال بقاعدة البيانات ❌"
        );

    }

}


/* =====================================================
   DATES
===================================================== */

function todayKey(){

    const d = new Date();

    return (
        d.getFullYear()
        + "-"
        + String(d.getMonth()+1).padStart(2,"0")
        + "-"
        + String(d.getDate()).padStart(2,"0")
    );

}


function parseDate(value){

    if(!value){
        return new Date("invalid");
    }

    return new Date(
        value + "T00:00:00"
    );

}


function addMonths(value, months){

    let d = parseDate(value);

    let day = d.getDate();

    d.setMonth(
        d.getMonth() + months
    );

    if(d.getDate() !== day){
        d.setDate(0);
    }

    return (
        d.getFullYear()
        + "-"
        + String(d.getMonth()+1).padStart(2,"0")
        + "-"
        + String(d.getDate()).padStart(2,"0")
    );

}


function formatDate(value){

    if(!value){
        return "—";
    }

    let d = parseDate(value);

    if(isNaN(d.getTime())){
        return "—";
    }

    return (
        String(d.getDate()).padStart(2,"0")
        + "/"
        + String(d.getMonth()+1).padStart(2,"0")
        + "/"
        + d.getFullYear()
    );

}


/* =====================================================
   NAVIGATION
===================================================== */

function showPage(pageId, button){

    document
    .querySelectorAll(".page")
    .forEach(page=>{
        page.classList.remove("active");
    });

    const page =
        document.getElementById(pageId);

    if(page){
        page.classList.add("active");
    }

    document
    .querySelectorAll(".nav button")
    .forEach(btn=>{
        btn.classList.remove("active");
    });

    if(button){
        button.classList.add("active");
    }

    refreshPage(pageId);

}


function activatePage(pageId){

    const buttons =
        document.querySelectorAll(".nav button");

    let target = null;

    buttons.forEach(btn=>{

        const action =
            btn.getAttribute("onclick") || "";

        if(
            action.includes(
                "showPage('" + pageId + "'"
            )
        ){
            target = btn;
        }

    });

    showPage(
        pageId,
        target
    );

}


function refreshPage(pageId){

    if(pageId === "home"){
        statistics();
        renderHomeProducts();
    }

    if(pageId === "stock"){
        renderProducts();
    }

    if(pageId === "workers"){
        renderWorkers();
    }

    if(pageId === "equipment"){
        renderEquipment();
    }

    if(pageId === "due"){
        renderDue();
    }

}


/* =====================================================
   STATISTICS
===================================================== */

function statistics(){

    const today =
        todayKey();

    const todayMoves =
        movements.filter(m=>{

            if(!m.created_at){
                return false;
            }

            return (
                String(m.created_at)
                .substring(0,10)
                === today
            );

        });


    const entry =
        todayMoves
        .filter(m=>m.type === "entry")
        .reduce(
            (total,m)=>
                total + Number(m.quantity || 0),
            0
        );


    const exit =
        todayMoves
        .filter(m=>m.type === "exit")
        .reduce(
            (total,m)=>
                total + Number(m.quantity || 0),
            0
        );


    const latest =
        getLatestEquipment();


    const due =
        latest.filter(e=>{

            return getEquipmentStatus(
                e.due_date
            ).className === "status-due";

        }).length;


    const p =
        document.getElementById(
            "productsNumber"
        );

    const en =
        document.getElementById(
            "entryToday"
        );

    const ex =
        document.getElementById(
            "exitToday"
        );

    const du =
        document.getElementById(
            "dueToday"
        );


    if(p){
        p.textContent =
            products.length;
    }

    if(en){
        en.textContent =
            entry;
    }

    if(ex){
        ex.textContent =
            exit;
    }

    if(du){
        du.textContent =
            due;
    }

}


/* =====================================================
   PRODUCT
===================================================== */

function openProduct(){

    clearProductForm();

    const title =
        document.getElementById(
            "productTitle"
        );

    if(title){
        title.textContent =
            "إضافة منتج";
    }

    const modal =
        document.getElementById(
            "productModal"
        );

    if(modal){
        modal.classList.add("show");
    }

}


function closeProduct(){

    const modal =
        document.getElementById(
            "productModal"
        );

    if(modal){
        modal.classList.remove("show");
    }

}


function clearProductForm(){

    const fields = {

        editProductId:"",
        productName:"",
        productRef:"",
        productFamily:"",
        productLocation:"",
        productQty:0,
        productMin:0,
        productUnit:"قطعة",
        productNote:""

    };

    Object.keys(fields).forEach(id=>{

        const el =
            document.getElementById(id);

        if(el){
            el.value =
                fields[id];
        }

    });

}


/* =====================================================
   SAVE PRODUCT
===================================================== */

async function saveProduct(){

    const name =
        document.getElementById(
            "productName"
        )?.value.trim() || "";

    const reference =
        document.getElementById(
            "productRef"
        )?.value.trim() || "";


    if(!name || !reference){

        toast(
            "أدخل اسم المنتج والمرجع"
        );

        return;

    }


    const editId =
        document.getElementById(
            "editProductId"
        )?.value || "";


    const data = {

        name:name,

        reference:reference,

        family:
            document.getElementById(
                "productFamily"
            )?.value.trim() || "",

        location:
            document.getElementById(
                "productLocation"
            )?.value.trim() || "",

        quantity:
            Number(
                document.getElementById(
                    "productQty"
                )?.value
            ) || 0,

        minimum:
            Number(
                document.getElementById(
                    "productMin"
                )?.value
            ) || 0,

        unit:
            document.getElementById(
                "productUnit"
            )?.value || "قطعة",

        note:
            document.getElementById(
                "productNote"
            )?.value.trim() || "",

        updated_at:
            new Date().toISOString()

    };


    try{

        if(editId){

            await supabaseRequest(
                "products",
                "PATCH",
                data,
                "?id=eq." +
                encodeURIComponent(editId)
            );

            toast(
                "تم تعديل المنتج ✅"
            );

        }else{

            await supabaseRequest(
                "products",
                "POST",
                data
            );

            toast(
                "تمت إضافة المنتج ✅"
            );

        }


        closeProduct();

        await loadAllData();

    }catch(error){

        console.error(error);

        toast(
            "فشل حفظ المنتج ❌"
        );

    }

}


/* =====================================================
   RENDER PRODUCTS
===================================================== */

function renderProducts(){

    const box =
        document.getElementById(
            "products"
        );

    if(!box) return;


    const input =
        document.getElementById(
            "stockSearch"
        );


    const search =
        (
            input
            ? input.value
            : ""
        )
        .toLowerCase()
        .trim();


    const list =
        products.filter(p=>{

            const text =
                (p.name || "") + " " +
                (p.reference || "") + " " +
                (p.family || "") + " " +
                (p.location || "");

            return text
                .toLowerCase()
                .includes(search);

        });


    if(!list.length){

        box.innerHTML = `

        <div class="empty">

            <div class="empty-icon">
                📦
            </div>

            <h3>
                لا توجد منتجات
            </h3>

            <p>
                أضف أول منتج إلى المخزون.
            </p>

        </div>

        `;

        return;

    }


    box.innerHTML = "";


    list.forEach(p=>{

        const low =
            Number(p.quantity || 0)
            <=
            Number(p.minimum || 0);


        const div =
            document.createElement(
                "div"
            );


        div.className =
            "product";


        div.innerHTML = `

        <div class="product-main">

            <div class="product-info">

                <div class="product-icon">
                    📦
                </div>

                <div>

                    <div class="product-name">
                        ${safe(p.name)}
                    </div>

                    <div class="product-ref">
                        REF: ${safe(p.reference)}
                    </div>

                </div>

            </div>


            <div class="quantity ${low ? "low" : "good"}">

                ${Number(p.quantity || 0)}

                <small>
                    ${safe(p.unit || "قطعة")}
                </small>

            </div>

        </div>


        <div class="product-actions">

            <button
                class="small-btn edit"
                onclick="editProduct('${safe(p.id)}')">

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

}


/* =====================================================
   HOME PRODUCTS
===================================================== */

function renderHomeProducts(){

    const box =
        document.getElementById(
            "homeProducts"
        );

    if(!box) return;


    const list =
        products.slice(0,5);


    if(!list.length){

        box.innerHTML = `

        <div class="empty">

            <div class="empty-icon">
                📦
            </div>

            <h3>
                لا توجد منتجات
            </h3>

        </div>

        `;

        return;

    }


    box.innerHTML = "";


    list.forEach(p=>{

        const div =
            document.createElement(
                "div"
            );

        div.className =
            "product";


        div.innerHTML = `

        <div class="product-main">

            <div class="product-info">

                <div class="product-icon">
                    📦
                </div>

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

                ${Number(p.quantity || 0)}

                <small>
                    ${safe(p.unit || "قطعة")}
                </small>

            </div>

        </div>

        `;


        box.appendChild(div);

    });

}


/* =====================================================
   EDIT PRODUCT
===================================================== */

function editProduct(id){

    const p =
        products.find(
            x =>
                String(x.id)
                ===
                String(id)
        );


    if(!p) return;


    document.getElementById(
        "productTitle"
    ).textContent =
        "تعديل المنتج";


    document.getElementById(
        "editProductId"
    ).value =
        p.id;


    document.getElementById(
        "productName"
    ).value =
        p.name || "";


    document.getElementById(
        "productRef"
    ).value =
        p.reference || "";


    document.getElementById(
        "productFamily"
    ).value =
        p.family || "";


    document.getElementById(
        "productLocation"
    ).value =
        p.location || "";


    document.getElementById(
        "productQty"
    ).value =
        p.quantity || 0;


    document.getElementById(
        "productMin"
    ).value =
        p.minimum || 0;


    document.getElementById(
        "productUnit"
    ).value =
        p.unit || "قطعة";


    document.getElementById(
        "productNote"
    ).value =
        p.note || "";


    document.getElementById(
        "productModal"
    ).classList.add("show");

}


/* =====================================================
   DELETE PRODUCT
===================================================== */

async function deleteProduct(id){

    const p =
        products.find(
            x =>
                String(x.id)
                ===
                String(id)
        );


    if(!p) return;


    if(!confirm(
        "هل تريد حذف المنتج؟\n\n"
        + p.name
        + "\n\n"
        + "سجل الحركات سيبقى محفوظًا."
    )){

        return;

    }


    try{

        await supabaseRequest(
            "products",
            "DELETE",
            null,
            "?id=eq." +
            encodeURIComponent(id)
        );


        toast(
            "تم حذف المنتج ✅"
        );


        await loadAllData();

    }catch(error){

        console.error(error);

        toast(
            "فشل حذف المنتج ❌"
        );

    }

}


/* =====================================================
   MOVEMENTS
===================================================== */

function openMovement(type){

    if(!products.length){

        toast(
            "أضف منتجًا أولاً"
        );

        return;

    }


    movementType =
        type;


    const select =
        document.getElementById(
            "movementProduct"
        );


    if(!select) return;


    select.innerHTML = "";


    products.forEach(p=>{

        const option =
            document.createElement(
                "option"
            );


        option.value =
            p.id;


        option.textContent =
            p.name
            + " — "
            + p.reference
            + " — "
            + p.quantity
            + " "
            + p.unit;


        select.appendChild(
            option
        );

    });


    document.getElementById(
        "movementQty"
    ).value = "";


    document.getElementById(
        "movementParty"
    ).value = "";


    document.getElementById(
        "movementNote"
    ).value = "";


    document.getElementById(
        "movementTitle"
    ).textContent =
        type === "entry"
        ? "📥 دخول المخزون"
        : "📤 خروج المخزون";


    document.getElementById(
        "movementModal"
    ).classList.add("show");

}


function closeMovement(){

    const modal =
        document.getElementById(
            "movementModal"
        );

    if(modal){
        modal.classList.remove("show");
    }

}


/* =====================================================
   SAVE MOVEMENT
===================================================== */

async function saveMovement(){

    const productId =
        document.getElementById(
            "movementProduct"
        )?.value;


    const qty =
        Number(
            document.getElementById(
                "movementQty"
            )?.value
        );


    if(!productId){

        toast(
            "اختر المنتج"
        );

        return;

    }


    if(qty <= 0){

        toast(
            "أدخل كمية صحيحة"
        );

        return;

    }


    const p =
        products.find(
            x =>
                String(x.id)
                ===
                String(productId)
        );


    if(!p){

        toast(
            "المنتج غير موجود"
        );

        return;

    }


    if(
        movementType === "exit"
        &&
        qty > Number(p.quantity || 0)
    ){

        toast(
            "الكمية أكبر من المخزون ❌"
        );

        return;

    }


    const newQuantity =
        movementType === "entry"
        ?
        Number(p.quantity || 0) + qty
        :
        Number(p.quantity || 0) - qty;


    try{

        await supabaseRequest(
            "products",
            "PATCH",
            {
                quantity:newQuantity,

                updated_at:
                    new Date().toISOString()
            },
            "?id=eq." +
            encodeURIComponent(p.id)
        );


        await supabaseRequest(
            "movements",
            "POST",
            {

                product_id:p.id,

                product_name:p.name,

                reference:p.reference,

                type:movementType,

                quantity:qty,

                unit:p.unit,

                party:
                    document.getElementById(
                        "movementParty"
                    )?.value.trim() || "",

                note:
                    document.getElementById(
                        "movementNote"
                    )?.value.trim() || ""

            }
        );


        closeMovement();


        toast(
            movementType === "entry"
            ?
            "تم تسجيل الدخول ✅"
            :
            "تم تسجيل الخروج ✅"
        );


        await loadAllData();

    }catch(error){

        console.error(error);

        toast(
            "فشل تسجيل العملية ❌"
        );

    }

}


/* =====================================================
   WORKER
===================================================== */

function openWorker(){

    clearWorkerForm();


    document.getElementById(
        "workerTitle"
    ).textContent =
        "إضافة عامل";


    document.getElementById(
        "workerModal"
    ).classList.add("show");

}


function closeWorker(){

    const modal =
        document.getElementById(
            "workerModal"
        );

    if(modal){
        modal.classList.remove("show");
    }

}


function clearWorkerForm(){

    const fields = {

        editWorkerId:"",
        workerMatricule:"",
        workerName:"",
        workerJob:"",
        workerDepartment:"",
        workerStructure:"",
        workerHireDate:"",
        workerStatus:"active",
        workerNote:""

    };


    Object.keys(fields).forEach(id=>{

        const el =
            document.getElementById(id);

        if(el){
            el.value =
                fields[id];
        }

    });

}


/* =====================================================
   SAVE WORKER
===================================================== */

async function saveWorker(){

    const matricule =
        document.getElementById(
            "workerMatricule"
        )?.value.trim() || "";


    const name =
        document.getElementById(
            "workerName"
        )?.value.trim() || "";


    if(!matricule || !name){

        toast(
            "Matricule والاسم إجباريان"
        );

        return;

    }


    const editId =
        document.getElementById(
            "editWorkerId"
        )?.value || "";


    const duplicate =
        workers.find(w=>{

            return (
                String(w.matricule)
                .toLowerCase()
                ===
                matricule.toLowerCase()
                &&
                String(w.id)
                !==
                String(editId)
            );

        });


    if(duplicate){

        toast(
            "هذا الـ Matricule موجود مسبقًا"
        );

        return;

    }


    const data = {

        matricule:matricule,

        name:name,

        job:
            document.getElementById(
                "workerJob"
            )?.value.trim() || "",

        department:
            document.getElementById(
                "workerDepartment"
            )?.value.trim() || "",

        structure:
            document.getElementById(
                "workerStructure"
            )?.value.trim() || "",

        hire_date:
            document.getElementById(
                "workerHireDate"
            )?.value || null,

        status:
            document.getElementById(
                "workerStatus"
            )?.value || "active",

        note:
            document.getElementById(
                "workerNote"
            )?.value.trim() || "",

        updated_at:
            new Date().toISOString()

    };


    try{

        if(editId){

            await supabaseRequest(
                "workers",
                "PATCH",
                data,
                "?id=eq." +
                encodeURIComponent(editId)
            );


            toast(
                "تم تعديل العامل ✅"
            );

        }else{

            await supabaseRequest(
                "workers",
                "POST",
                data
            );


            toast(
                "تمت إضافة العامل ✅"
            );

        }


        closeWorker();

        await loadAllData();

    }catch(error){

        console.error(error);

        toast(
            "فشل حفظ العامل ❌"
        );

    }

}


/* =====================================================
   RENDER WORKERS
===================================================== */

function renderWorkers(){

    const box =
        document.getElementById(
            "workersList"
        );

    if(!box) return;


    const input =
        document.getElementById(
            "workerSearch"
        );


    const search =
        (
            input
            ? input.value
            : ""
        )
        .toLowerCase()
        .trim();


    const list =
        workers.filter(w=>{

            const text =
                (w.matricule || "") + " " +
                (w.name || "") + " " +
                (w.job || "") + " " +
                (w.department || "") + " " +
                (w.structure || "");


            return text
                .toLowerCase()
                .includes(search);

        });


    if(!list.length){

        box.innerHTML = `

        <div class="empty">

            <div class="empty-icon">
                👷
            </div>

            <h3>
                لا يوجد عمال
            </h3>

            <p>
                أضف أول عامل باستعمال Matricule.
            </p>

        </div>

        `;

        return;

    }


    box.innerHTML = "";


    list.forEach(w=>{

        const div =
            document.createElement(
                "div"
            );


        div.className =
            "worker";


        div.innerHTML = `

        <div class="worker-main">

            <div class="worker-info">

                <div class="worker-icon">
                    👷
                </div>

                <div>

                    <div class="worker-name">
                        ${safe(w.name)}
                    </div>

                    <div class="worker-matricule">
                        Matricule:
                        ${safe(w.matricule)}
                    </div>

                </div>

            </div>


            <div class="worker-status ${
                w.status === "active"
                ? ""
                : "inactive"
            }">

                ${
                    w.status === "active"
                    ? "Actif"
                    : "Sorti"
                }

            </div>

        </div>


        <div class="worker-details">

            <div class="worker-detail">
                💼 ${safe(w.job || "بدون وظيفة")}
            </div>

            <div class="worker-detail">
                🏢 ${safe(w.department || "بدون مصلحة")}
            </div>

            <div class="worker-detail">
                🏗️ ${safe(w.structure || "بدون Structure")}
            </div>

        </div>


        <div class="product-actions">

            <button
                class="small-btn edit"
                onclick="editWorker('${safe(w.id)}')">

                ✏️ تعديل

            </button>

            <button
                class="small-btn delete"
                onclick="deleteWorker('${safe(w.id)}')">

                🗑️ حذف

            </button>

        </div>

        `;


        box.appendChild(div);

    });

}


/* =====================================================
   EDIT WORKER
===================================================== */

function editWorker(id){

    const w =
        workers.find(
            x =>
                String(x.id)
                ===
                String(id)
        );


    if(!w) return;


    document.getElementById(
        "workerTitle"
    ).textContent =
        "تعديل العامل";


    document.getElementById(
        "editWorkerId"
    ).value =
        w.id;


    document.getElementById(
        "workerMatricule"
    ).value =
        w.matricule || "";


    document.getElementById(
        "workerName"
   