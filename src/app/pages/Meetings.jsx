import React from "react";

import { Category } from "./Category";
import { meetingNotes } from "./../../notes";

export class Meetings extends React.Component {
	render() {
		return <Category base={"/meetings/"} notes={meetingNotes} />;
	}
}

Meetings.label = "Meetings";
Meetings.route = "/meetings";
