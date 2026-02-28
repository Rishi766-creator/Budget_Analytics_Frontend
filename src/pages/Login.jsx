import {useState} from "react";
import {Link,useNavigate} from "react-router-dom";
import API from "../api/axios";
export default function Login(){
    const navigate=useNavigate();
    const [form ,setForm]=useState({email:"",password:""});
    const [error,setError]=useState("");
    const [loading,setLoading]=useState(false);
    const handleChange=(e)=>{
        setForm((prev)=>({
            ...prev,
            [e.target.name]:e.target.value,
        }));
    };
    const handleSubmit=async (e)=>{
        e.preventDefault();
        setError("");
        if(!form.email||!form.password){
            return setError("Email and password are required");
        }
        try{
            setLoading(true);
            const res=await API.post("/auth/login",form);
            localStorage.setItem("token",res.data.token);
            localStorage.setItem("user",JSON.stringify(res.data.user));
            navigate("/dashboard");

        }catch(err){
            setError(
                err?.response?.data?.message || "Login failed.Try again."
            )
        }finally{
            setLoading(false);
        }
    };

    return(
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 border border-gray-200">
                <h1 className="text-2xl font-bold text-gray-800 text-center">
                    Budget Analytics
                </h1>
                <p className="text-sm text-gray-500 text-center mt-1">
                    Login to Continue
                </p>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-black focus:outline-none" 
                        />

                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="*****"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-black focus:outline-none" 
                        />

                    </div> 
                    {error && (
                        <p className="text-sm text-red-600">{error}</p>
                    )} 
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black text-white py-2 rounded-lg font-semibold hover:bg-gray-800 transition duration-200"
                        >{loading?"Logging in....":"Login"}</button>                  
                </form>
                <p className="text-sm text-center text-gray-600 mt-6">
                    Don't have an account?{" "}
                    <Link
                        to="/register"
                        className="text-black font-semibold hover:underline">
                            Register
                        </Link>
                </p>
            </div>
        </div>
    )
}