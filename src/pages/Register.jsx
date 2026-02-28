import {useState} from "react";
import {Link,useNavigate} from "react-router-dom";
import API from "../api/axios";
export default function Register(){
    const navigate=useNavigate();
    const [form,setForm]=useState({
        name:"",
        email:"",
        password:"",
        confirmPassword:"",
    });
    const [error,setError]=useState("");
    const [loading,setLoading]=useState(false);
    const handleChange=(e)=>{
        setForm((prev)=>({
            ...prev,
            [e.target.name]:e.target.value,
        }));
    };
    const handleSubmit=async (e) =>{
        e.preventDefault();
        setError("");
        if(!form.name||!form.email||!form.password||!form.confirmPassword){
            return setError("All fields are required");
        }
        if(form.password.length<6){
            return setError("Password must be at least 6 characters");
        }
        if(form.password!==form.confirmPassword){
            return setError("Passwords do not match");
        }
        try{
            setLoading(true);
            const payload={
                name:form.name,
                email:form.email,
                password:form.password
            };
            const res=await API.post("/auth/register",payload);

                localStorage.setItem("token",res.data.token);
                localStorage.setItem("user",JSON.stringify(res.data.user));
                navigate("/dashboard",{replace:true});
            }
        catch(err){
            setError(err?.response?.data?.message||"Registration failed.Try again");

        }finally{
            setLoading(false);
        }
    }
    return(
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="w-full ma-w-md bg-white shadow-xl rounded-2xl p-8 border border-gray-200">
                <h1 className="text-2xl font-bold text-gray-800 text-center">
                    Create Account
                </h1>
                <p className="text-sm text-gray-500 text-center mt-1">
                    Register to start tracking your budget.

                </p>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Your Name"
                            className="w-full px-4 py-2 border border-gary-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                        /> 
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="Your Email"
                            className="w-full px-4 py-2 border border-gary-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                        /> 
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="*****"
                            className="w-full px-4 py-2 border border-gary-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                        /> 
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            placeholder="*****"
                            className="w-full px-4 py-2 border border-gary-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                        /> 




                    </div>
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black text-white py-2 rounded-lg font-semibold hover:bg-gray-800 transition duration-200 disabled:opacity-600 disabled:cursor-not-allowed"
                    >
                        {loading ? "Creating account..." : "Register"}
                    </button>
                </form>
                <p className="text-sm text-center text-gray-600 mt-6">
                    Already have an account?{" "}
                    <Link to="/login" className="text-black font-semibold hover:underline">Login</Link>
                </p>

            </div>
        </div>
    )
}