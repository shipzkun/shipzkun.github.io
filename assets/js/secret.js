$(document).ready(function() {
	const id = "s0db9774b86aa5a219a0939cdd5c5aa08"

	function decrypt(cipher, key) {
		var keyArray = sha256.update(key + _gj.salt).array();
		var iv = aesjs.utils.hex.toBytes(_gj.iv);
		var encryptedBytes = aesjs.utils.hex.toBytes(cipher);
		var aesCbc = new aesjs.ModeOfOperation.cbc(keyArray, iv);
		var decryptedBytes = aesCbc.decrypt(encryptedBytes);
		var final = aesjs.utils.utf8.fromBytes(decryptedBytes);

		if (final.includes(id)) {
		  return $($.parseHTML(final)).filter('#'+id).html();
		}
	}

	function attempt() {
		cipher = $('#secure-container').text().trim();

		key = $("input[name=key]").val();
		plain = decrypt(cipher, key);
		console.log(plain);

		if (typeof plain == 'undefined') {
			alert("Wrong key provided!")
		} else {
			alert("Enjoy! ( ͡° ͜ʖ ͡°)")
			$("#secure-container").html(plain).show()
			$("#decrypt").parent().remove()
		}
	}

	$("#decrypt").click(attempt);
	$("input[name=key]").keypress(function(e) {
		// 13 = Enter key
		if (e.which == 13) {
			attempt()
		}
	});

});
