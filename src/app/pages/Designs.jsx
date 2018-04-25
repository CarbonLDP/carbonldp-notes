import React from "react";

import { Category } from "./Category";
import { designNotes } from "./../../notes";

export class Designs extends React.Component {
	render() {
		return <Category base={"/designs/"} notes={designNotes} />;
	}
}

Designs.label = "Designs";
Designs.route = "/designs";
