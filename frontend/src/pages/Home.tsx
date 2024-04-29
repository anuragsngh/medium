import { Link } from "react-router-dom"
export const Home =()=>{
     return <div className="bg-yellow-400 h-screen">
        <div className="bg-yellow-400  border-slate-950 border-b">
            <div className="border-b flex justify-between px-10 py-4">
                <div className="flex flex-col justify-center text-xl font-bold">
                        Medium
                </div>
                <div>
                <Link to={`/signup`}>
                    <button type="button" className="mr-4 text-white bg-slate-950 hover:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 ">
                        Signup
                    </button>
                </Link>
                <Link to={`/signin`}>
                <button type="button" className="mr-4 text-white bg-slate-950 hover:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 ">
                        Signin
                    </button>
                </Link>

                
                </div>
            </div>
        </div>
        <div className="pt-60 flex justify-center flex-col">
        <div className="flex justify-center">
            <div className="max-w-2xl">
                <div className="text-3xl font-bold">
                    "The customer support I received was exceptional. The support team went above and beyond to address my concerns"
                </div>
                <div className="max-w-md text-xl font-semibold text-left mt-4">
                    Julies Winfield
                </div>
                <div className="max-w-md text-sm font-light text-slate-400">
                    CEO | Acme corp
                </div>
            </div>
        </div>
        
    </div>
    </div>
  
}