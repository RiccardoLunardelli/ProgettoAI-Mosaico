import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";


//Oggetto per gestire le chiamate API eseguite alla prima renderizzazione
function APICallFirstRenderManagerTag() {
  const dispatch = useDispatch();


  const authCheck: string | null = useSelector(
    (state: {
      authCheckSlice: {
        value: string | null;
      };
    }) => state.authCheckSlice.value,
  );

  //Metodo per eseguire le prime chiamate api
  const ExeFirstCall = () => {
    //Chiamate da svolgere
  };

  //Ogni volta che cambia authCheck
  useEffect(() => {
    //Controllo di sicurezza
    if ((authCheck ?? "") == "") {
      //Si ferma qua
      return;
    }

    //Se è autenticato

    //Esegue le prime chiamate
    ExeFirstCall();

    //Imposta un intervallo ogni x minuti
    /*const intervalRef = setInterval(() => {
      ExeFirstCall(false);
    }, 60000);

    return () => {
      clearInterval(intervalRef);
    };*/
  }, [authCheck]);

  return <></>;
}

export default APICallFirstRenderManagerTag;
