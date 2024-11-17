class Agsao {
	// internal constants
	#GENERATION_MAX_ATTEMPT = 10
	#WORD_SELECT_MAX_ATTEMPT = 10
	#SPECIALS = "~!@#$%^&*()_+`-='\"{}[]\\|<>,./?"
	#ENTCALC = null

	// Number of elements to insert in a batch array merge
	// Here to avoid "stack call size exceeded"
	//#ARR_MERGE_BATCH_MAX_ELEMS = 100000

	// config variables: default values
	#configs = {
		wordlen_min : 4,
		wordlen_max : 7,
		addnum : "end",
		addspecial : "no",
		allow_dupe_words : true,
		capitalise_words : true,
		num_words : 3,
		separator : "|",
		phraselen_min : 12,
		phraselen_max : 70,
		min_entropy_bits : 80,
	}

	// internal class variables
	#corpus = []
	// format: [wordlist_url] = is_loaded (true|false)
	#wordlists = {}
	// will we need to reload the corpus?
	#reload_corpus = true
	// will we need to validate the configs
	#validate_confs = true

	constructor(confs) {
		if (confs) {
			this.#configs = confs
		}

		this.#SPECIALS = this.#SPECIALS.split('')
	}

	set wordlists(lists) {
		// add new wordlists
		for (const url of lists) {
			if (!this.#wordlists[url]) {
				this.#wordlists[url] = false
				this.#reload_corpus = true
			}
		}

		// remove unneeded wordlists that were previously loaded
		for (const i in this.#wordlists) {
			if (!lists.includes(i)) {
				delete this.#wordlists[i]
				this.#reload_corpus = true
			}
		}
	}

	set configs(confs) {
		for (const conf in confs) {
			if (this.#configs[conf] != confs[conf]) {
				this.#validate_confs = true
				break
			}
		}
		this.#configs = confs
	}

	set entropy_calculator(fn) {
		if (typeof fn !== 'function') {
			console.log("Invalid calculator function.")
		} else {
			this.#ENTCALC = fn
		}
	}

	// Our main method
	// General algo:
	// 1. Load corpus from wordlists
	// 2. Generate passphrase from wordlists
	// 3. Show passphrase entropy
	async generate() {
		// 0: validate configs
		let errors = this.validate_configs()
		if (Object.keys(errors).length != 0) return this.#error("Invalid configs detected", errors);

		// 1: Init corpus from wordlists
		return await this.#init_corpus().then(() => {
			// 2: Generate passphrase
			return this.#gen_phrase()
			//if (!phrase.success) return this.#error(phrase.msg)
		});
	}

	async #init_corpus() {
		if (!this.#reload_corpus) {
			return true
		}

		if (Object.keys(this.#wordlists).length == 0) {
			this.#corpus = []
			return true
		}


		// force reload everything
		// optimise if it's too slow
		let toload = []
		for (const url in this.#wordlists) {
			toload.push(url)
		}

		return Promise.all(toload.map(url =>
			fetch(url)
			.then(response => response.text())
		)).then(data => {
			var tw = []
			for (let i = 0; i < data.length; i++) {
			// to avoid "stack call size exceeded" on large arrays
				tw = [...tw, ...data[i].split("\n")]
			}
			this.#corpus = [...new Set(tw)]
			for (let i in this.#wordlists) {
				this.#wordlists[i] = true
				this.#reload_corpus = false
			}
		})
	}


	/*** Internal functions ***/

	// Standard return objects
	#success(data){return {"success":true, "data":data}}
	#error(msg,data){return {"success":false, "data":data, "msg":msg}}


	validate_configs() {
        if (!this.#validate_confs) {
        	return {}
        }

		let errors = {}
        let opts = this.#configs
        // alias to avoid typing
		let maxint = Number.MAX_SAFE_INTEGER

		let isInt = function(text) {
	        return !isNaN(text) && (text | 0 == text);
	    }

        if (Object.keys(this.#wordlists).length == 0) {
            errors["wordlists"] = "Please select at least one word list.";
        }

        if (!isInt(opts.wordlen_min) || opts.wordlen_min < 1 || opts.wordlen_min > maxint) {
            errors["wordlen_min"] = "Minimum word length must be a number between 1 and "+maxint+", inclusive";
        }

        if (!isInt(opts.wordlen_max) || opts.wordlen_max < 1 || opts.wordlen_max > maxint) {
            errors["wordlen_max"] = "Maximum word length must be a number between 1 and "+maxint+", inclusive";
        }

        if (isInt(opts.wordlen_min) && isInt(opts.wordlen_max) && opts.wordlen_min > opts.wordlen_max) {
            errors["wordlen_min"] = "Minimum word length must be a number ≤ maximum word length ("+opts.wordlen_max+")";
        }

        let add_positions = ["no", "start", "end", "random"];
        if (!add_positions.includes(opts.addnum)) {
            errors["addnum"] = "Please select a valid option from the list.";
        }
        if (!add_positions.includes(opts.addspecial)) {
            errors["addspecial"] = "Please select a valid option from the list.";
        }

        if (!isInt(opts.num_words) || opts.num_words < 1 || opts.num_words > maxint) {
            errors["num_words"] = "Number of words must be a number between 1 and "+maxint+", inclusive";
        }

        if (!isInt(opts.phraselen_min) || opts.phraselen_min < 1 || opts.phraselen_min > maxint) {
            errors["phraselen_min"] = "Minimum passphrase length must be a number between 1 and "+maxint+", inclusive";
        }

        if (!isInt(opts.phraselen_max) || opts.phraselen_max < 1 || opts.phraselen_max > maxint) {
            errors["phraselen_max"] = "Maximum passphrase length must be a number between 1 and "+maxint+", inclusive";
        }

        if (isInt(opts.phraselen_min) && isInt(opts.phraselen_max) && opts.phraselen_min > opts.phraselen_max) {
           	errors["phraselen_min"] = "Minimum passphrase length must be a number ≤ maximum passphrase length ("+opts.phraselen_max+")";
        }

      	if (typeof this.#ENTCALC !== 'function') {
			errors["min_entropy_bits"] = "No valid entropy calculator provided. This will be useless.";
		} else if (!isInt(opts.min_entropy_bits) || opts.min_entropy_bits < 1 || opts.min_entropy_bits > maxint) {
        	errors["min_entropy_bits"] = "Minimum entropy bits must be a number between 1 and "+maxint+", inclusive";
       	}

        return errors;
    }

	// function return: {success: true|false, data: "phrase" | "errmsg"}
	#gen_phrase() {
		let phrase = null;
		let phrase_entropy_bits = 0;

		let opts = this.#configs

		// closures we'll use here
		let rand =  function(start, end) {
			let byteArray = new Uint32Array(1);

			window.crypto.getRandomValues(byteArray);
			let randno = byteArray[0] / (0xffffffff + 1);
			return Math.floor(randno * (end - start + 1)) + start;
		}
		const ucfirst = ([first, ...rest], locale = navigator.language) => first.toLocaleUpperCase(locale) + rest.join('');
		let insertChar = function (str, c, pos) {
	        switch (pos) {
	            case 'start': pos = 0; break;
	            case 'end':   pos = str.length; break;
	            case 'random': default: // intentional fall-through
					pos = rand(0,str.length); break;
	        }

	        return str.slice(0, pos)+c+str.slice(pos, str.length);
	    }

	    // Generate!
        for (let a=0; a<this.#GENERATION_MAX_ATTEMPT; a++) {
      		phrase = null;
        	phrase_entropy_bits = 0;

			// 1: Select words, applying min and max lengths
            let selected = [];

            let ws_attempt = 0; // word select attempt counter
			let cplen = this.#corpus.length

            while (selected.length < opts.num_words && ws_attempt < this.#WORD_SELECT_MAX_ATTEMPT) {
                ws_attempt++;
                let w = this.#corpus[rand(0, cplen-1)];

                // discard dupes if desired
                if (!opts.allow_dupe_words && selected.includes(w)) continue;

                // apply min and max word lengths
                if (w.length < opts.wordlen_min || w.length > opts.wordlen_max) continue;

                selected.push(w);
                ws_attempt = 0;

            }

            // Check if we successfully fulfilled the num_words requirement
            if (selected.length != opts.num_words) {
            	return this.#error("Cannot select "+opts.num_words+" words from corpus");
            }

            // 2: once here, we fulfilled the word length requirements
            // we apply the other rules
            let spchar_pos = ["start", "end", "random"];
            for (let i=0; i<selected.length; i++) {
                if (opts.capitalise_words)
                    selected[i] = ucfirst(selected[i]);
                if (spchar_pos.includes(opts.addnum) && (rand(1,2) == 2))
                    selected[i] = insertChar(selected[i], rand(0,9), opts.addnum);
                if (spchar_pos.includes(opts.addspecial) && (rand(1,2) == 2))
                    selected[i] = insertChar(selected[i], this.#SPECIALS[rand(0,9)], opts.addspecial);
            }

            // implode to one string
            phrase = selected.join(opts.separator);

			// if less than minlength, start over
            if (phrase.length < opts.phraselen_min) continue;

            // truncate to requested length
            phrase = phrase.substr(0, opts.phraselen_max);

			// compute entropy
			phrase_entropy_bits = this.#ENTCALC(phrase)
			if (phrase_entropy_bits == null || phrase_entropy_bits < opts.min_entropy_bits) {
				phrase = null
				continue
			}

			// we're ok if we got here.
			break;
        }

		if (phrase == null) {
			return this.#error("Cannot generate passphrase based on the given options")
		} else {
			return this.#success({"phrase":phrase, "entropy":phrase_entropy_bits})
		}
	}

}



export { Agsao };
