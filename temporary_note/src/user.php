<?php
	// Dumped from the include() vulnerability

	class User {
		var $Name = '';
		var $Notes = [];
		var $Password = '';
		var $IsAdmin = false;
		function __construct($name, $password) {
			$this->Name = $name;
			$this->Password = hash('sha256',$password);
		}

		function checkPassword($input) {
			return $this->Password == hash('sha256', $input);
		}

		function isAdmin() {
			return $this->IsAdmin;
		}

		function getName() {
			return $this->Name;
		}

		function getNote($id) {
			return $this->Notes[$id];
		}

		function getNoteCount() {
			return count($this->Notes);
		}

		function updateNote($id,$content) {
			$this->Notes[$id] = $content;
		}
		function createNote($content) {
			$this->Notes[] = $content;
		}

		function forceAdmin() {
			$this->IsAdmin = true;
		}
}