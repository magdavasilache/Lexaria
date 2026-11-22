import Description from "../components/Description";
import Footer from "../components/Footer";
import Quote from "../components/Quote";

export default function WelcomePage() {
    return (
        <div className="min-h-[calc(100dvh-60px)] flex flex-col overflow-x-hidden bg-backgroundLight dark:bg-backgroundDark">
            <main className="flex flex-col">
                <Description />
                <Quote />
            </main>
            <Footer />
        </div>
    )
}
