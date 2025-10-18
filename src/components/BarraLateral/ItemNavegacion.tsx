import { type FC } from "react";
import { NavLink } from "react-router-dom";

interface IProps {
    iconoActivo: string,
    iconoInactivo: string,
    link: string,
};

const ItemNavegacion: FC<IProps> = ({
    iconoActivo,
    iconoInactivo,
    link,
}) => {
    return <NavLink to={link}>
        {({ isActive }) => (
            <img src={isActive ? iconoActivo : iconoInactivo} />
        )}
    </NavLink>
};

export default ItemNavegacion;