(function(){
  const g=id=>document.getElementById(id);
  const gate=g("gate"), panels={menu:document.createElement("div"),code:g("gateCode"),qr:g("gateQR")};
  const video=g("qrVideo"), msg=g("scanMsg"), canvas=document.createElement("canvas"), cx=canvas.getContext("2d",{willReadFrequently:true});
  let stream=null, scanning=false;

  function show(name){
    Object.entries(panels).forEach(([k,el])=>el.classList.toggle("active",k===name));
    g("gateOptions").style.display=name==="menu"?"grid":"none";
    if(name!=="qr")stopCamera();
    if(name==="code")setTimeout(()=>g("codeInput").focus(),50);
    if(name==="qr")startCamera();
  }

  function enter(label){
    stopCamera();
    g("buildingTag").textContent=label;
    gate.classList.add("leaving");
    setTimeout(()=>{gate.classList.add("hidden-gate");window.dispatchEvent(new Event("resize"));},450);
    window.scrollTo(0,0);
  }
  function openGate(){
    gate.classList.remove("hidden-gate");
    requestAnimationFrame(()=>gate.classList.remove("leaving"));
    g("codeInput").value="";
    show("menu");
  }

  /* --- code option --- */
  function randomCode(){
    const letters="ABCDEFGHJKLMNPQRSTUVWXYZ";
    return "BLD-"+letters[Math.floor(Math.random()*letters.length)]+Math.floor(100+Math.random()*900);
  }
  g("randomCodeBtn").addEventListener("click",()=>{
    const c=randomCode(); g("codeInput").value=c; setTimeout(()=>enter(c),350);
  });
  g("codeForm").addEventListener("submit",e=>{
    e.preventDefault();
    const c=g("codeInput").value.trim().toUpperCase();
    if(c)enter(c); else g("codeInput").focus();
  });

  /* --- QR option (any QR code is accepted) --- */
  async function startCamera(){
    msg.className="";msg.textContent="Starting camera…";
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
      msg.className="err";msg.textContent="Camera not available here (needs HTTPS or localhost). Use the demo scan button below.";return;
    }
    try{
      stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
      video.srcObject=stream;await video.play();
      msg.textContent="Point the camera at any QR code…";
      scanning=true;requestAnimationFrame(tick);
    }catch(err){
      msg.className="err";msg.textContent="Camera blocked or unavailable. Use the demo scan button below.";
    }
  }
  function stopCamera(){
    scanning=false;
    if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}
    video.srcObject=null;
  }
  function tick(){
    if(!scanning)return;
    if(video.readyState===video.HAVE_ENOUGH_DATA&&window.jsQR){
      canvas.width=video.videoWidth;canvas.height=video.videoHeight;
      cx.drawImage(video,0,0,canvas.width,canvas.height);
      const img=cx.getImageData(0,0,canvas.width,canvas.height);
      const res=jsQR(img.data,img.width,img.height,{inversionAttempts:"dontInvert"});
      if(res){ // any QR code works
        msg.textContent="QR code detected ✓";
        const label=(res.data||"").trim().slice(0,18)||"QR-BUILDING";
        scanning=false;setTimeout(()=>enter(label),300);return;
      }
    }
    requestAnimationFrame(tick);
  }
  g("demoScanBtn").addEventListener("click",()=>{msg.className="";msg.textContent="QR code detected ✓";setTimeout(()=>enter("QR-DEMO"),300);});

  /* --- navigation --- */
  g("optCode").addEventListener("click",()=>show("code"));
  g("optQR").addEventListener("click",()=>show("qr"));
  document.querySelectorAll(".gate-back").forEach(b=>b.addEventListener("click",()=>show("menu")));
  g("changeBuilding").addEventListener("click",openGate);
})();