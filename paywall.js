<script>
/* === Sense Bridge PAYWALL MVP === */

const FREE_LIMIT = 1;

// 🔗 PODMIEŃ NA SWOJE LINKI STRIPE (LIVE)
const STRIPE_LINKS = {
  "24h": "https://buy.stripe.com/XXXXXXXX24",
  "7d":  "https://buy.stripe.com/XXXXXXXX7D",
  "30d": "https://buy.stripe.com/XXXXXXXX30"
};

function now(){ return Date.now(); }

function getAccessUntil(){
  return Number(localStorage.getItem("sb_access_until") || 0);
}

function hasAccess(){
  return now() < getAccessUntil();
}

function freeUsed(){
  return Number(localStorage.getItem("sb_free_used") || 0);
}

function markFreeUsed(){
  localStorage.setItem("sb_free_used", String(freeUsed()+1));
}

function grantAccess(ms){
  localStorage.setItem("sb_access_until", String(now()+ms));
}

// Wywołuj po każdej analizie
function checkPaywall(){
  if (hasAccess()) return true;

  if (freeUsed() < FREE_LIMIT){
    markFreeUsed();
    return true;
  }

  showPaywall();
  return false;
}

// === UI PAYWALL ===
function showPaywall(){
  if (document.getElementById("sb-paywall")) return;

  const box = document.createElement("div");
  box.id = "sb-paywall";
  box.style = `
    position:fixed; inset:0; z-index:9999;
    background:rgba(5,8,20,.92);
    display:flex; align-items:center; justify-content:center;
    padding:16px;
  `;

  box.innerHTML = `
    <div style="
      max-width:420px; width:100%;
      background:#0e1438; color:#fff;
      border-radius:22px; padding:20px;
      box-shadow:0 20px 60px rgba(0,0,0,.6);
      font-family:system-ui;
    ">
      <h2 style="margin:0 0 10px;font-size:22px">
        Dalsza analiza wymaga dostępu
      </h2>
      <p style="opacity:.85;line-height:1.5">
        To pismo może mieć <b>konsekwencje prawne lub finansowe</b>.<br>
        Sense Bridge pokazuje sens, ryzyka i neutralne odpowiedzi —
        bez porad i bez presji.
      </p>

      <button onclick="goPay('24h')" style="${btnStyle}">
        🔓 24h dostępu — 3 €
      </button>
      <button onclick="goPay('7d')" style="${btnStyle}">
        🔓 7 dni — 7 €
      </button>
      <button onclick="goPay('30d')" style="${btnStyle}">
        🔓 30 dni — 15 €
      </button>

      <p style="margin-top:10px;font-size:12px;opacity:.7">
        Bez konta • Bez subskrypcji • Dane nie są zapisywane
      </p>
    </div>
  `;

  document.body.appendChild(box);
}

const btnStyle = `
  width:100%; padding:12px; margin-top:10px;
  border-radius:14px; border:0;
  font-size:16px; font-weight:700;
  cursor:pointer;
`;

function goPay(type){
  localStorage.setItem("sb_pay_return", type);
  window.location.href = STRIPE_LINKS[type];
}

// === PO POWROCIE ZE STRIPE ===
(function checkReturn(){
  const t = localStorage.getItem("sb_pay_return");
  if(!t) return;

  localStorage.removeItem("sb_pay_return");

  if(t==="24h") grantAccess(24*60*60*1000);
  if(t==="7d")  grantAccess(7*24*60*60*1000);
  if(t==="30d") grantAccess(30*24*60*60*1000);

  const pw = document.getElementById("sb-paywall");
  if(pw) pw.remove();
  function checkPaywall(){
  const access = hasAccess();

  if(access.mode === "LOCKED"){
  refreshUI();
  const el = document.getElementById("access") || document.getElementById("sb-paywall");
  if(el) el.scrollIntoView({ behavior: "smooth" });
  return false;
}

  return true;
}
})();
</script>