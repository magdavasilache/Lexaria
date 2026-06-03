import { useNavigate } from "react-router-dom";
import SimpleButton from "./buttons/SimpleButton";

interface Props {
    logout: () => void
}
export default function UserBar({ logout }: Props) {
    const navigate = useNavigate()

    const handleNavigateToImportPage = () => {
        navigate("/goodreads-import")
    }

    const handleNavigateToAdminPanel = () => {
        navigate("/admin-panel")
    }
    return (
        <div className="flex flex-col gap-2 w-[150px]">
            <div><SimpleButton text="Logout" buttonFunction={logout} /></div>
            <div><SimpleButton text="Admin Panel" buttonFunction={handleNavigateToAdminPanel} /></div>
            <div><SimpleButton text="Goodreads Import" buttonFunction={handleNavigateToImportPage} /></div>
        </div>
    )
}