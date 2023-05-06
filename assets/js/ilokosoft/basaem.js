class Basaem {
    #article_list=[]
    #is_random_weighted = false
    // will only make sense if is_random_weighted = true
    #shown_articles={}

    // Our main method
	// Choose one article randomly
	// Assumption: article_list has all desired content
    // try making async if this becomes too slow
	get_article() {
        // if weighted random and we have seen everything,
        // reset our tracker so we don't end up in an infinite loop below
        if (this.#is_random_weighted && 
            Object.keys(this.#shown_articles).length == Object.keys(this.#article_list).length
        ) {
            this.#shown_articles = {}
        }

        let i = 0;
        // Pick random article
        // if not weighted, return immediately.
        // else, pick unseen
        do {
            i = this.get_randint(0,this.#article_list.length)
        } while (this.#is_random_weighted && typeof this.#shown_articles[i] != 'undefined')
        
        // if applicable, mark article as seen
        if (this.#is_random_weighted) {
            this.#shown_articles[i] = this.#article_list[i]
        }
        
        // return article
        return this.#article_list[i]
	}

    // code from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random#getting_a_random_number_between_two_values    
    get_randint(x, y) {
        return Math.floor(Math.random() * (y - x) + x); 
    }
    
    async load_links(url) {
        let response = await fetch(url)
        if (response.ok) {
            this.#article_list = await response.json();
        } else {
            alert("Error loading article list!")
            console.log(response)
        }
    }

    set_weighted_random(is_weighted) {
        let changed = (this.#is_random_weighted != is_weighted)
        this.#is_random_weighted = is_weighted

        if (changed && is_weighted) {
            this.#shown_articles = {}
        }
    }
}

export { Basaem };
