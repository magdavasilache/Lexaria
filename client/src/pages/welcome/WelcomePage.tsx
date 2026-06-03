import Description from "./components/Description";
import Footer from "./components/Footer";
import Quote from "./components/Quote";

export default function WelcomePage(){
    return (
        <div className="bg-backgroundLight dark:bg-backgroundDark">
            <Description />
            <Quote />
            <Footer />
        </div>
    )
}