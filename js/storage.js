
const database = firebase.database();
const productsRef = database.ref('products');

// دالة لإضافة المنتج إلى قاعدة البيانات
window.addProduct = function addProduct() {
    document.getElementById('successMessage').style.display = 'none';
    document.getElementById('loader').style.display = 'block';

    const productName = document.getElementById('productName').value;
    const productPrice = document.getElementById('productPrice').value;
    const productQuantity = document.getElementById('productQuantity').value;

    if (productName === "" || productPrice === "" || productQuantity === "") {
        alert("من فضلك أدخل جميع البيانات.");
        document.getElementById('loader').style.display = 'none';
        return;
    }

    const today = new Date();
    const dateKey = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

    productsRef.once('value').then((snapshot) => {
        let nextId = 1;
        snapshot.forEach(childSnapshot => {
            const childId = childSnapshot.key;
            if (childId.startsWith(dateKey)) {
                const numericId = parseInt(childId.slice(-3));
                if (numericId >= nextId) {
                    nextId = numericId + 1;
                }
            }
        });

        const productId = `${dateKey}${String(nextId).padStart(3, '0')}`; // ID بالتنسيق المطلوب

        productsRef.child(productId).set({
            name: productName,
            price: productPrice,
            quantity: productQuantity,
            timestamp: new Date().toISOString()
        }, function(error) {
            document.getElementById('loader').style.display = 'none';

            if (error) {
                alert("حدث خطأ أثناء إضافة المنتج.");
            } else {
                document.getElementById('successMessage').style.display = 'block';
                document.getElementById('productName').value = "";
                document.getElementById('productPrice').value = "";
                document.getElementById('productQuantity').value = "";
            }
        });
    });
}

// دالة لتحميل المنتجات وعرضها مع التحديث اللحظي
window.loadProducts = function loadProducts() {
    const productsListDiv = document.getElementById('productsList');
    productsListDiv.innerHTML = "";
    document.getElementById('loader').style.display = 'block';

    productsRef.on('value', (snapshot) => {
        document.getElementById('loader').style.display = 'none';
        productsListDiv.innerHTML = ""; // مسح القائمة القديمة قبل إعادة تحميل المنتجات

        snapshot.forEach(childSnapshot => {
            const product = childSnapshot.val();
            const productId = childSnapshot.key;

            const productItem = document.createElement('div');
            productItem.className = 'product-item';
            productItem.innerHTML = `
                <h3>${product.name} (ID: ${productId})</h3>
                <p>السعر: ${product.price}</p>
                <p>الكمية: ${product.quantity}</p>
                <p>تاريخ الإضافة: ${new Date(product.timestamp).toLocaleString()}</p>
                <button onclick="editProduct('${productId}')">تعديل</button>
                <button onclick="deleteProduct('${productId}')">حذف</button>
            `;
            productsListDiv.appendChild(productItem);
        });
    });
};


// دالة لتصفية المنتجات بناءً على إدخال البحث
window.filterProducts = function filterProducts() {
    const searchValue = document.getElementById('searchInput').value.toLowerCase();
    const productsListDiv = document.getElementById('productsList');
    const productItems = productsListDiv.getElementsByClassName('product-item');

    Array.from(productItems).forEach(item => {
        const productName = item.getElementsByTagName('h3')[0].innerText.toLowerCase();
        const productId = item.getElementsByTagName('h3')[0].innerText.split('(ID: ')[1].split(')')[0]; // استخراج ID

        if (productName.includes(searchValue) || productId.includes(searchValue)) {
            item.style.display = ""; // عرض المنتج
        } else {
            item.style.display = "none"; // إخفاء المنتج
        }
    });
}

// دالة لتعديل المنتج
window.editProduct = function editProduct(productId) {
    const productRef = productsRef.child(productId);

    productRef.once('value').then((snapshot) => {
        if (snapshot.exists()) {
            const productData = snapshot.val();

            // تعبئة الحقول
            document.getElementById('productName').value = productData.name;
            document.getElementById('productPrice').value = productData.price;
            document.getElementById('productQuantity').value = productData.quantity;

            // تغيير زر الإضافة إلى تحديث
            const addButton = document.querySelector('button[onclick="addProduct()"]');
            addButton.onclick = function() {
                updateProduct(productId);
            };

            // تركيز الفوكس على الحقل الأول
            document.getElementById('productName').focus();  // تركيز على حقل اسم المنتج
        } else {
            alert("المنتج غير موجود.");
        }
    });
}


// // دالة لتحديث المنتج
// window.updateProduct = function updateProduct(productId) {
//     const productName = document.getElementById('productName').value;
//     const productPrice = document.getElementById('productPrice').value;
//     const productQuantity = document.getElementById('productQuantity').value;

//     if (productName === "" || productPrice === "" || productQuantity === "") {
//         alert("من فضلك أدخل جميع البيانات.");
//         return;
//     }

//     productsRef.child(productId).update({
//         name: productName,
//         price: productPrice,
//         quantity: productQuantity,
//         timestamp: new Date().toISOString()
//     }, function(error) {
//         if (error) {
//             alert("حدث خطأ أثناء تحديث المنتج.");
//         } else {
//             alert("تم تحديث المنتج بنجاح.");
//             document.getElementById('productName').value = "";
//             document.getElementById('productPrice').value = "";
//             document.getElementById('productQuantity').value = "";

//             const addButton = document.querySelector('button[onclick="addProduct()"]');
//             addButton.onclick = addProduct;

//             loadProducts();
//         }
//     });
// }

// دالة لتحديث المنتج
window.updateProduct = function updateProduct(productId) {
    // جلب القيم المدخلة من الحقول
    const name = document.getElementById('productName').value;
    const price = document.getElementById('productPrice').value;
    
    // تحويل الكمية إلى رقم للتأكد من التعامل الصحيح معها
    const quantity = parseFloat(document.getElementById('productQuantity').value);

    // التحقق من إدخال جميع البيانات والتأكد من أن الكمية رقم صحيح
    if (name === "" || price === "" || isNaN(quantity)) {
        alert("يرجى إدخال جميع البيانات.");
        return;
    }

    // تحديث بيانات المنتج في Firebase
    productsRef.child(productId).update({
        name: name,
        price: price,
        quantity: quantity,  // التعامل مع الكمية كرقم
        timestamp: new Date().toISOString() // حفظ التاريخ والوقت الحالي
    }, function(error) {
        if (error) {
            // في حالة حدوث خطأ أثناء التحديث
            alert("حدث خطأ أثناء تحديث المنتج.");
        } else {
            // في حالة نجاح التحديث
            alert("تم تحديث المنتج بنجاح.");
            
            // مسح الحقول بعد التحديث
            document.getElementById('productName').value = "";
            document.getElementById('productPrice').value = "";
            document.getElementById('productQuantity').value = "";

            // تغيير زر الإضافة ليعمل كما كان بعد التحديث
            const addButton = document.querySelector('button[onclick="addProduct()"]');
            addButton.onclick = addProduct;

            // إعادة تحميل المنتجات المحدثة في القائمة
            loadProducts();
        }
    });
}





// دالة لحذف المنتج
window.deleteProduct = function deleteProduct(productId) {
    if (confirm("هل أنت متأكد أنك تريد حذف هذا المنتج؟")) {
        productsRef.child(productId).remove()
            .then(() => {
                alert("تم حذف المنتج بنجاح.");
                loadProducts();
            })
            .catch((error) => {
                alert("حدث خطأ أثناء حذف المنتج.");
            });
    }
}

// دالة لتبديل عرض جميع المنتجات
window.toggleProducts = function toggleProducts() {
    const productsListDiv = document.getElementById('productsList');
    const searchInput = document.getElementById('searchInput');

    if (productsListDiv.style.display === "none") {
        loadProducts();
        productsListDiv.style.display = "block";
        searchInput.style.display = "block";
        document.getElementById('toggleButton').innerText = "إخفاء المنتجات";
    } else {
        productsListDiv.style.display = "none";
        searchInput.style.display = "none";
        document.getElementById('toggleButton').innerText = "عرض جميع المنتجات";
    }
}
// الاستماع إلى إضافة منتجات جديدة
productsRef.on('child_added', (snapshot) => {
    const product = snapshot.val();
    const productId = snapshot.key;
    
    const productItem = document.createElement('div');
    productItem.className = 'product-item';
    productItem.innerHTML = `
        <h3>${product.name} (ID: ${productId})</h3>
        <p>السعر: ${product.price}</p>
        <p>الكمية: ${product.quantity}</p>
        <p>تاريخ الإضافة: ${new Date(product.timestamp).toLocaleString()}</p>
        <button onclick="editProduct('${productId}')">تعديل</button>
        <button onclick="deleteProduct('${productId}')">حذف</button>
    `;
    document.getElementById('productsList').appendChild(productItem);
});

// الاستماع إلى تعديل المنتجات
productsRef.on('child_changed', (snapshot) => {
    const product = snapshot.val();
    const productId = snapshot.key;
    
    const productItem = document.querySelector(`.product-item h3:contains('ID: ${productId}')`).parentElement;
    if (productItem) {
        productItem.innerHTML = `
            <h3>${product.name} (ID: ${productId})</h3>
            <p>السعر: ${product.price}</p>
            <p>الكمية: ${product.quantity}</p>
            <p>تاريخ الإضافة: ${new Date(product.timestamp).toLocaleString()}</p>
            <button onclick="editProduct('${productId}')">تعديل</button>
            <button onclick="deleteProduct('${productId}')">حذف</button>
        `;
    }
});

// الاستماع إلى حذف المنتجات
productsRef.on('child_removed', (snapshot) => {
    const productId = snapshot.key;
    
    const productItem = document.querySelector(`.product-item h3:contains('ID: ${productId}')`).parentElement;
    if (productItem) {
        productItem.remove();
    }
});

