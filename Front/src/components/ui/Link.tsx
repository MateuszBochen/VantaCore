import { NavLink as RouterLink } from 'react-router-dom';
import type {TypeLinkProps} from './types.ts';


const Link = (props: TypeLinkProps) => {
  return(
    <RouterLink
      to={props.to}
      onClick={props?.onClick}
    >
      {props.children}
    </RouterLink>
  );
}

export default Link;
