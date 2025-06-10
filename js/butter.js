(function(root) {
  var Butter = function() {
    var self = this;
    this.defaults = {
      wrapperId: 'butter',
      wrapperDamper: 0.07,
      cancelOnTouch: false
    };

    this.validateOptions = function(ops) {
      for (var prop in ops) {
        if (self.defaults.hasOwnProperty(prop)) {
          Object.defineProperty(self.defaults, prop, {
            value: Object.getOwnPropertyDescriptor(ops, prop).value
          });
        }
      }
    };

    this.wrapperDamper;
    this.wrapperId;
    this.cancelOnTouch;
    this.wrapper;
    this.wrapperOffset = 0;
    this.animateId;
    this.resizing = false;
    this.active = false;
    this.wrapperHeight;
    this.bodyHeight;
    this.initialized = false;
  };

  Butter.prototype = {
    init: function(options) {
      if (options) this.validateOptions(options);
      
      var self = this;
      
      // Wait for content to be ready
      this.waitForContent().then(function() {
        self.setupButter();
      });
    },

    waitForContent: function() {
      var self = this;
      return new Promise(function(resolve) {
        var checkContent = function() {
          var wrapper = document.getElementById(self.defaults.wrapperId);
          if (wrapper && wrapper.clientHeight > 0 && document.readyState === 'complete') {
            resolve();
          } else {
            setTimeout(checkContent, 50);
          }
        };
        
        if (document.readyState === 'complete') {
          setTimeout(checkContent, 100); // Small delay for rendering
        } else {
          window.addEventListener('load', function() {
            setTimeout(checkContent, 100);
          });
        }
      });
    },

    setupButter: function() {
      if (this.initialized) return;
      
      this.active = true;
      this.initialized = true;
      this.wrapperDamper = this.defaults.wrapperDamper;
      this.wrapperId = this.defaults.wrapperId;
      this.cancelOnTouch = this.defaults.cancelOnTouch;

      this.wrapper = document.getElementById(this.wrapperId);
      
      if (!this.wrapper) {
        console.error('Butter: Wrapper element not found');
        return;
      }

      // Apply styles
      this.wrapper.style.position = 'fixed';
      this.wrapper.style.width = '100%';
      this.wrapper.style.top = '0';
      this.wrapper.style.left = '0';

      // Calculate heights with proper timing
      var self = this;
      setTimeout(function() {
        self.updateDimensions();
        self.bindEvents();
        self.startAnimation();
        
        // Force scroll reset
        window.scrollTo(0, 0);
        self.wrapperOffset = 0;
      }, 50);
    },

    updateDimensions: function() {
      this.wrapperHeight = this.wrapper.clientHeight;
      document.body.style.height = this.wrapperHeight + 'px';
    },

    bindEvents: function() {
      window.addEventListener('resize', this.debounce(this.resize.bind(this), 150));
      if (this.cancelOnTouch) {
        window.addEventListener('touchstart', this.cancel.bind(this));
      }
    },

    startAnimation: function() {
      this.wrapperOffset = 0.0;
      this.animateId = window.requestAnimationFrame(this.animate.bind(this));
    },

    // Debounce function for better performance
    debounce: function(func, wait) {
      var timeout;
      return function executedFunction() {
        var later = function() {
          clearTimeout(timeout);
          func.apply(this, arguments);
        }.bind(this);
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    wrapperUpdate: function() {
      var scrollY = this.getScrollTop();
      this.wrapperOffset += (scrollY - this.wrapperOffset) * this.wrapperDamper;
      
      // Use transform3d for better performance
      this.wrapper.style.transform = 'translate3d(0,' + (-this.wrapperOffset.toFixed(2)) + 'px, 0)';
    },

    getScrollTop: function() {
      return document.scrollingElement ? 
        document.scrollingElement.scrollTop : 
        (document.documentElement.scrollTop || document.body.scrollTop || 0);
    },

    checkResize: function() {
      if (this.wrapper && this.wrapperHeight !== this.wrapper.clientHeight) {
        this.resize();
      }
    },

    resize: function() {
      var self = this;
      if (!self.resizing && self.active) {
        self.resizing = true;
        window.cancelAnimationFrame(self.animateId);
        
        setTimeout(function() {
          if (self.wrapper) {
            self.updateDimensions();
            self.startAnimation();
          }
          self.resizing = false;
        }, 150);
      }
    },

    animate: function() {
      if (!this.active) return;
      
      this.checkResize();
      this.wrapperUpdate();
      this.animateId = window.requestAnimationFrame(this.animate.bind(this));
    },

    cancel: function() {
      if (this.active) {
        window.cancelAnimationFrame(this.animateId);
        window.removeEventListener('resize', this.resize);
        window.removeEventListener('touchstart', this.cancel);
        
        if (this.wrapper) {
          this.wrapper.removeAttribute('style');
        }
        document.body.removeAttribute('style');

        this.active = false;
        this.initialized = false;
        this.wrapper = null;
        this.wrapperOffset = 0;
        this.resizing = false;
        this.animateId = null;
      }
    },

    // Method to reinitialize if needed
    reinit: function(options) {
      this.cancel();
      setTimeout(() => {
        this.init(options);
      }, 100);
    }
  };

  root.butter = new Butter();
  
  // Auto-initialize when DOM is ready (optional)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      // Uncomment next line if you want auto-initialization
      // root.butter.init();
    });
  }
  
})(this);
