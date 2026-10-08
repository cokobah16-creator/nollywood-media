/* Test-only stand-in for three.js r128 (the real library loads from cdnjs, which this
   environment can't reach). Every property is a callable, constructible proxy, so game
   code runs its logic and DOM without rendering anything. Positions written to a proxy
   are kept, so world coordinates stay meaningful. Never ship this. */
(function(){
  function mk(name){
    const t = function(){}; t.__stub = name;
    const vec = /(position|scale|rotation|quaternion|up|target|center|offset|repeat|color)$/.test(name);
    if(vec){ t.x = 0; t.y = 0; t.z = 0; t.w = 1; }
    return new Proxy(t, {
      get(o, p){
        if(p === Symbol.toPrimitive) return ()=>0;
        if(p === 'then' || p === 'toJSON') return undefined;
        if(p === Symbol.iterator) return function*(){};
        if(p === Symbol.hasInstance) return ()=>false;
        if(p in o) return o[p];
        if(p === 'length') return 0;
        const c = mk(name + '.' + String(p)); o[p] = c; return c;
      },
      apply(){ return mk(name + '()'); },
      construct(){ return mk('new ' + name); },
      set(o, p, v){ o[p] = v; return true; },
    });
  }
  window.THREE = mk('THREE');
  window.__THREE_STUB__ = true;
})();
