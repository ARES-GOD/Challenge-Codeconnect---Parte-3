import React from "react";
import Authentication from "../components/Authentication";

interface RegisterProps {
    onLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onLogin }) => {
    return (
        <Authentication
            initialMode="register"
            onLogin={onLogin}
        />
    );
};

export default Register;
