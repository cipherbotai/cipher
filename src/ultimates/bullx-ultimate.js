const main = () => {
  const OGST = window.setTimeout;
  window.setTimeout = function (handler, timeout, ...args) {
    const protectedFunctions = [
      "()=>{P9e(),n(!0)}",
      "()=>{Test1(),n(!0)}",
      "function(){i.keepAlive()}",
      "()=>{this.timer&&(this.timer=lt(this.timer))}",
      '()=>r(Dp(this.auth,"network-request-failed"))',
    ];

    const forceInstant =
      timeout > 500 && !protectedFunctions.includes(handler.toString());

    return OGST(handler, forceInstant ? 0 : timeout, ...args);
  };
};
main();
