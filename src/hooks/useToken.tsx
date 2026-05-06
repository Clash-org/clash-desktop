import { ethers } from "ethers";
import { useApi } from "./useApi";
import { useEffect, useState } from "react";
import { NATIVE_CURRENCIES } from "@/constants";

export function useToken() {
  const { rpc } = useApi()
  const provider = new ethers.JsonRpcProvider(rpc);
  const [token, setToken] = useState(NATIVE_CURRENCIES[137]);

  const getToken = async () => {
    const network = await provider.getNetwork()
    const token = NATIVE_CURRENCIES[Number(network.chainId)]
    if (!token)
      throw new Error()
    return token
  }

  useEffect(()=>{
    getToken().then(res=>setToken(res)).catch(()=>setToken(NATIVE_CURRENCIES[137]))
  }, [])

  return {
    token
  }
}