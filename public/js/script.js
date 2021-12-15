(function () {
  'use strict';

  /**
   * Supplant does variable substitution on the string. It scans through the
   * string looking for expressions enclosed in {{ }} braces. If an expression
   * is found, use it as a key on the object, and if the key has a string value
   * or number value, it is substituted for the bracket expression and it repeats.
   * This is useful for automatically fixing URLs or for templating HTML.
   * Based on: http://www.crockford.com/javascript/remedial.html
   *
   * @param {string} str 
   * @param {object} object
   * @returns {string}
   */
  function supplant(str, object) {
    return str.replace(
      /\{\{[ ]*([^{} ]*)[ ]*\}\}/g,
      function (a, b) {
        let r = object[b];
        return typeof r === 'string' || typeof r === 'number' ? r : a;
      }
    );
  }

  /**
   * Make an AJAX request with XHR. Returns a Promise.
   * 
   * @param {string} url 
   * @param {'GET'|'POST'|'PUT'|'HEAD'|'DELETE'} method 
   * @param {*} data
   * @returns {Promise}
   */
  function doAjax(url, method, data) {
    const request = new XMLHttpRequest();                    // create the XHR request    
    return new Promise(function (resolve, reject) {          // return it as a Promise
      request.onreadystatechange = function () {             // setup our listener to process compeleted requests
        if (request.readyState !== 4) return;                // only run if the request is complete
        if (request.status >= 200 && request.status < 300) { // process the response, when successful
          resolve(JSON.parse(request.responseText));
        } else { // when failed
          reject({
            status: request.status,
            statusText: request.statusText
          });
        }
      };
      request.open(method || 'GET', url, true);                       // setup our HTTP request
      if (data) {                                                     // when data is given...
        request.setRequestHeader("Content-type", "application/json"); // set the request content-type as JSON, and
        request.send(JSON.stringify(data));                           // send data as JSON in the request body.
      } else {
        request.send(); // send the request
      }
    });
  }

  /**
   * Invoke the route associated with the given URL hash. If no route matches,
   * redirects to the default route.
   *
   * @param {string} hash 
   */
  function invokeRoute(hash) {
    if (hash.startsWith('#/')) {
      const [ route, ...params ] = hash.substr(2).split('/');
      if (routes[route]) {
        routes[route](...params);
      } else {
        routes.index();
      }
    } else {
      routes.index();
    }
  }

  /**
   * Actually change the content of the view. Replaces the innerHTML in the
   * #page element, and then updates the history, either by pushing a new state
   * or replacing the existing state if this is a redirection.
   *
   * @param {string} url 
   * @param {string} title 
   * @param {string} html 
   * @param {boolean} isRedirect
   */
  function changeView(url, title, html, isRedirect = false) {
    const data = { url, title, html };
    document.title = title;
    document.getElementById('page').innerHTML = html;
    if (window.location.hash !== url) {
      if (isRedirect) {
        window.history.replaceState(data, '', url);
      } else {
        window.history.pushState(data, '', url);
      }
    }
  }

  const GetCatalog            = '/api/catalog';
  const GetProductsByCategory = '/api/products/category/:id';
  const GetProductById        = '/api/products/:id';
  const GetCart               = '/api/cart';
  const UpdateCart            = '/api/cart/update';

  const templates = {};
  const routes = {
    catalog(isRedirect) {
      doAjax(GetCatalog).then(catalog => {
        const content = catalog.map(c => supplant(templates['category-card'], c)).join('');
        const html    = supplant(templates['catalog-page'], { content });

        changeView('#/catalog', 'Catalog', html, isRedirect);
        document.querySelectorAll('.category-card').forEach(card => {
          card.addEventListener('click', () => {
            routes.category(card.dataset.id);
          });
        });
      });
    },
    category(id) {
      doAjax(GetCatalog).then(catalog => {
        const category = catalog.find(c => c.id === (+id));
        if (!category) {
          routes.index();
          return;
        }
        doAjax(GetProductsByCategory.replace(':id', id)).then(products => {
          const title   = supplant(templates['category-card'], category);
          const content = products.map(p => supplant(templates['product-card'], p)).join('');
          const html    = supplant(templates['category-page'], { title, content });

          changeView(`#/category/${id}`, category.name, html);
          document.querySelector('.category-card').addEventListener('click', routes.catalog);
        });
      });
    },
    products(id) {
      doAjax(GetProductById.replace(':id', id)).catch(routes.index).then(product => {
        product.cost = product.cost.toFixed(2);
        doAjax(GetCatalog).then(catalog => {
          const category = catalog.find(c => c.id === product.catId);
          doAjax(GetProductsByCategory.replace(':id', category.id)).then(products => {
            const title   = supplant(templates['category-card'], category);
            const content = products.map(p => supplant(templates['product-card'], p)).join('');
            const html    = supplant(templates['category-page'], { title, content });
            const details = supplant(templates['product-page'], product);

            changeView(`#/products/${id}`, product.name, html);
            document.querySelector('.category-card').addEventListener('click', routes.catalog);
            document.getElementById('product-info').innerHTML = details;
            document.querySelector(`.product-card[data-id="${id}"]`).className += ' active';
            document.querySelector(`.product-card[data-id="${id}"]`).focus();
            document.querySelector('.add-to-cart').addEventListener('click', function () {
              let id = this.dataset.id;
              doAjax(GetCart).then(cart => {
                const item = cart.find(i => i.id === id);
                const qty  = item ? item.qty + 1 : 1;

                doAjax(UpdateCart, 'POST', { id, qty }).then(routes.cart);
              });
            });
          });
        });
      });
    },
    cart() {
      doAjax(GetCart).then(cart => {
        Promise.all(cart.map(item => doAjax(GetProductById.replace(':id', item.id)))).then(products => {
          products.forEach(p => {p.cost = p.cost.toFixed(2)});
          const content = cart.map((item, i) => supplant(supplant(templates['cart-row'], item), products[i])).join('');
          const html    = supplant(templates['cart-page'], { content });

          changeView(`#/cart`, 'Cart', html);
          document.querySelectorAll('.update-cart').forEach(btn => {
            btn.addEventListener('click', () => {
              let id  = btn.dataset.id;
              let qty = +(document.getElementById(`qty-${id}`).value);
              doAjax(UpdateCart, 'POST', { id, qty }).then(() => {
                routes.cart();
                alert('Cart Updated.');
              });
            });
          });
        });
      });
    },
    index() {
      routes.catalog(true);
    }
  };

  document.querySelectorAll('script[type="text/x-template"]').forEach((el) => { templates[el.id] = el.innerText; });
  window.addEventListener('hashchange', () => invokeRoute(window.location.hash));
  window.addEventListener('popstate', (ev) => {
    if (ev.state) {
      document.title = ev.state.title;
      invokeRoute(ev.state.url);
    }
  });
  window.addEventListener('keyup', (ev) => {
    if (ev.key === 'Enter') {
      document.activeElement.click();
    }
  });
  invokeRoute(window.location.hash);
}());
